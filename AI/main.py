#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Refactored main.py (emb2-only)
- Removes legacy search (text+image fusion) and related helpers
- Keeps generation pipeline (optional) and all emb2 search utilities
- Always uses emb2 scoring (image-only CLIP + Lab ΔE + breed)
"""

from __future__ import annotations

# ================================
# Imports (trimmed)
# ================================
import os
import cv2
import faiss
import glob
import json
import math
import argparse
import logging
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any

import numpy as np
import torch
import clip
import matplotlib.pyplot as plt
from PIL import Image
from colorsys import rgb_to_hsv
from sklearn.cluster import KMeans
from ultralytics import YOLO
from skimage import color as skcolor  # ΔE2000

# (Optional) generation pipeline
from diffusers import StableDiffusionImg2ImgPipeline, DPMSolverMultistepScheduler
from diffusers.utils import load_image


# ================================
# Global models
# ================================
device = "cuda" if torch.cuda.is_available() else "cpu"
seg_model = YOLO("./process/model/seg.pt")
detect_model = YOLO("./process/model/0818.pt")
clip_model, preprocess = clip.load("ViT-B/32", device=device)


# ================================
# Config / Constants
# ================================
@dataclass
class SearchWeights:
    image: float = 0.5
    color: float = 0.5
    breed: float = 0.0
    sigma: float = 10.0  # color sensitivity for ΔE → similarity


BREED_ALIASES: Dict[str, set] = {
    "jindo": {"jindo-dog", "jindo", "진도", "jindo_dog"},
    "pomeranian": {"pomeranian", "포메", "pome"},
    "toy_poodle": {"toy_poodle", "toy-poodle", "poodle", "토이푸들"},
    "mix": {"mix", "mixed", "믹스", "mongrel"},
}

# 하드 필터 규칙
@dataclass
class SearchRules:
    require_breed_match: bool = True   # True면 품종 불일치 즉시 제외
    min_color_sim: float = 0.4         # 색상 유사도(가우시안 변환값) 미만이면 제외
    max_deltaE: float = 40.0           # ΔE2000 이 값 초과면 제외(색 너무 다름)


# ================================
# Logging
# ================================
def setup_logger(debug: bool):
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=level, format="%(asctime)s | %(levelname)s | %(message)s")

    # Quiet noisy libs
    for name, lvl in {
        "urllib3": logging.WARNING,
        "PIL": logging.WARNING,
        "faiss": logging.INFO,
        "matplotlib": logging.WARNING,
        "matplotlib.backends": logging.WARNING,
        "matplotlib.font_manager": logging.ERROR,
    }.items():
        logging.getLogger(name).setLevel(lvl)

    try:
        import matplotlib as mpl
        mpl.set_loglevel("warning")
    except Exception:
        pass


# ================================
# Debug state
# ================================
@dataclass
class DebugState:
    latest_file: Optional[str] = None
    search_image_path: Optional[str] = None
    output_dir: Optional[str] = None

    seg_ok: Optional[bool] = None
    top_colors: List[Tuple[List[int], float]] = field(default_factory=list)
    predicted_color: Optional[str] = None

    breed_name: Optional[str] = None
    breed_conf: Optional[float] = None
    det_boxes: List[Dict[str, Any]] = field(default_factory=list)

    prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    lora_name: Optional[str] = None
    lora_scale: Optional[float] = None
    ref_img: Optional[str] = None
    ip_adapter_scale: Optional[float] = None
    sd_model_path: Optional[str] = None
    pipe_ready: bool = False

    generated: bool = False
    gen_image_path: Optional[str] = None
    gen_params: Dict[str, Any] = field(default_factory=dict)

    top_k: int = 0
    faiss_top: List[Dict[str, Any]] = field(default_factory=list)

    def summary(self):
        logging.debug("\n" + "=" * 80 + "\nDEBUG SUMMARY\n" + "=" * 80)
        logging.debug(f"Latest file: {self.latest_file}")
        logging.debug(f"Search image path: {self.search_image_path}")
        logging.debug(f"Output dir: {self.output_dir}")
        logging.debug(f"Segmentation ok: {self.seg_ok}")
        if self.top_colors:
            logging.debug(
                "Top colors (RGB, ratio%): "
                + ", ".join([f"{tuple(rgb)} @ {ratio:.1f}%" for rgb, ratio in self.top_colors])
            )
        logging.debug(f"Predicted color: {self.predicted_color}")
        logging.debug(f"Breed: {self.breed_name} (conf={self.breed_conf})")
        if self.det_boxes:
            logging.debug("Detection boxes:")
            for b in self.det_boxes:
                logging.debug(f" - cls={b['cls']}, conf={b['conf']:.3f}, xyxy={b['xyxy']}")
        logging.debug(f"Prompt: {self.prompt}")
        logging.debug(f"Negative prompt: {self.negative_prompt}")
        logging.debug(
            f"LoRA: {self.lora_name} (scale={self.lora_scale}), ref_img={self.ref_img}"
        )
        logging.debug(
            f"SD model: {self.sd_model_path}, IP-Adapter scale: {self.ip_adapter_scale}, pipe_ready={self.pipe_ready}"
        )
        logging.debug(f"Generated: {self.generated}, gen_image_path={self.gen_image_path}")
        if self.gen_params:
            logging.debug(
                "Generation params: " + ", ".join([f"{k}={v}" for k, v in self.gen_params.items()])
            )
        if self.faiss_top:
            ex = ", ".join(
                [f"#{x['rank']} id={x['id']} sim={x['similarity']:.3f}" for x in self.faiss_top[:10]]
            )
            logging.debug(f"FAISS top (first 10): {ex}")
        logging.debug("=" * 80 + "\n")


# ================================
# Utility helpers (seg/color, breed, color sim)
# ================================

def normalize_breed(name: str) -> str:
    x = name.lower().replace(" ", "_")
    for k, vals in BREED_ALIASES.items():
        if x in vals:
            return k
    return x

def breed_similarity(qb: Optional[str], cb: str) -> float:
    return 1.0 if qb and normalize_breed(qb) == normalize_breed(cb) else 0.0


def color_similarity_from_deltaE(dE: float, sigma: float = 10.0) -> float:
    # Gaussian kernel mapping ΔE2000 → [0,1]
    return math.exp(- (float(dE) / float(sigma)) ** 2)

# ---- Segmentation/Color (for generation and Lab extraction) ----

def get_mask(model: YOLO, image: Image.Image, conf: float = 0.25, imgsz: int = 640, debug: bool = False):
    results = model.predict(image, conf=conf, imgsz=imgsz)
    if not results or not results[0].masks:
        if debug:
            logging.debug("[get_mask] No mask returned")
        return None

    masks = results[0].masks.data
    combined = masks.sum(dim=0).clamp(0, 1).cpu().numpy().astype(np.uint8)
    h, w = np.array(image).shape[:2]
    resized = cv2.resize(combined, (w, h), interpolation=cv2.INTER_NEAREST)
    return np.stack([resized.astype(bool)] * 3, axis=-1)


def apply_chroma_background(image_np: np.ndarray, mask_3ch: np.ndarray, chroma=(0, 255, 0)) -> np.ndarray:
    return np.where(mask_3ch, image_np, np.array(chroma, dtype=np.uint8))

def get_dominant_color(img_bgr: np.ndarray, k: int = 8, exclude_color=(0, 255, 0), threshold: int = 30, debug: bool = False):
    flat = img_bgr.reshape((-1, 3))
    exclude_color = np.array(exclude_color)
    distances = np.linalg.norm(flat - exclude_color, axis=1)
    mask = distances > threshold
    filt = flat[mask]
    if len(filt) < k:
        raise ValueError("Too few pixels after chroma filter")
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = kmeans.fit_predict(filt)
    counts = np.bincount(labels)
    center = kmeans.cluster_centers_[int(np.argmax(counts))].astype(int)
    if debug:
        logging.debug(f"[get_dominant_color] centers={kmeans.cluster_centers_.astype(int)}, counts={counts}")
    return center, kmeans.cluster_centers_.astype(int), counts


def analyze_colors(img_bgr_chroma: np.ndarray, top_n: int = 4, debug: bool = False):
    dom, centers, counts = get_dominant_color(img_bgr_chroma, debug=debug)
    total = counts.sum()
    ratios = (counts / total) * 100
    sorted_idxs = np.argsort(-counts)
    return [(centers[i].astype(int), ratios[i]) for i in sorted_idxs[:top_n]]


def classify_color(rgb: Tuple[int, int, int], debug: bool = False) -> str:
    """RGB 값을 HSV로 변환하여 색상을 분류합니다."""
    # 1. RGB 값 분리 및 0~1 범위로 정규화
    b, g, r = rgb
    r_, g_, b_ = (c / 255.0 for c in (r, g, b))
    
    # 2. HSV로 변환 (H: 색상, S: 채도, V: 명도)
    h, s, v = rgb_to_hsv(r_, g_, b_)
    h *= 360.0  # 색상(Hue) 범위를 0~360도로 변환
    
    if debug:
        logging.debug(f"[classify_color] RGB={rgb} -> H={h:.1f}, S={s:.2f}, V={v:.2f}")
    
    # 3. 색상 분류 로직
    
    # 명도가 매우 낮으면 'black'
    if v < 0.15:
        return "black"
        
    # 명도가 매우 높으면 'white'
    if v > 0.95:
        return "white"
        
    # 색상(H)이 주황색/갈색 범위이고 채도(S)가 일정 수준 이상일 때
    if 10 <= h <= 40 and s >= 0.15:
        # 명도(V)가 낮으면 'brown', 아니면 'light brown'
        return "brown" if v < 0.3 else "light brown"
        
    # 위 조건에 해당하지 않으면서 명도가 낮으면 'black'
    if v < 0.4:
        return "black"
        
    # 위 조건에 해당하지 않으면서 채도가 매우 낮으면 (무채색 계열) 'white'
    if s <= 0.25:
        return "white"
        
    # 위의 모든 조건에 해당하지 않으면 'unknown'
    return "unknown"
    
def extract_query_lab(image_pil: Image.Image, seg_model: YOLO, k: int = 6, chroma_bgr=(0, 255, 0), thr: int = 30, debug: bool = False):
    rgb = np.array(image_pil)
    results = seg_model(image_pil, conf=0.25, imgsz=640)
    if not results or results[0].masks is None:
        dom_rgb = tuple(map(int, rgb.reshape(-1, 3).mean(axis=0)))
    else:
        masks = results[0].masks.data
        mask = masks.sum(dim=0).clamp(0, 1).cpu().numpy().astype(np.uint8)
        if mask.shape[:2] != rgb.shape[:2]:
            mask = cv2.resize(mask, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_NEAREST)
        mask3 = np.stack([mask] * 3, axis=-1).astype(bool)
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        masked_bgr = np.where(mask3, bgr, np.array(chroma_bgr, dtype=np.uint8))

        flat = masked_bgr.reshape(-1, 3)
        d = np.linalg.norm(flat - np.array(chroma_bgr, dtype=np.uint8), axis=1)
        filt = flat[d > thr]
        if filt.shape[0] < max(k, 1):
            mean_bgr = flat.mean(axis=0).astype(int)
            b, g, r = mean_bgr.tolist()
            dom_rgb = (r, g, b)
        else:
            km = KMeans(n_clusters=k, n_init=10, random_state=42)
            labels = km.fit_predict(filt)
            counts = np.bincount(labels)
            center = km.cluster_centers_[int(np.argmax(counts))].astype(int)
            b, g, r = center.tolist()
            dom_rgb = (r, g, b)

    arr = np.array([[[dom_rgb[0] / 255.0, dom_rgb[1] / 255.0, dom_rgb[2] / 255.0]]], dtype=np.float32)
    Lab = skcolor.rgb2lab(arr)[0, 0]
    if debug:
        logging.debug(f"[extract_query_lab] dom_rgb={dom_rgb} -> Lab={Lab.tolist()}")
    return float(Lab[0]), float(Lab[1]), float(Lab[2])


# ---- Detection / Breed ----

def classify_breed(image_pil: Image.Image, model_path: str = "./process/model/detect6.pt", debug: bool = False, det_state: Optional[DebugState] = None):
    model = YOLO(model_path)
    results = model.predict(source=image_pil, save=False)

    best_conf = 0.0
    best_breed = "dog"

    for result in results:
        names = result.names
        if hasattr(result, "boxes") and result.boxes is not None:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = list(map(lambda x: int(x), box.xyxy[0].tolist()))
                if det_state is not None:
                    det_state.det_boxes.append({"cls": names[cls], "conf": conf, "xyxy": xyxy})
                if conf > best_conf:
                    best_conf = conf
                    best_breed = names[cls]

    if debug:
        logging.debug(f"[classify_breed] best={best_breed}, conf={best_conf:.3f}")
    return best_breed, best_conf


# ---- Prompt / Generation ----

def build_prompt(breed_name: str, color_name: str, debug: bool = False) -> str:
    color_map = {
        "white": "white",
        "black": "black",
        "light brown": "light brown",
        "brown": "brown",
    }
    breed_map = {
        "Jindo-dog": "adult jindo dog",
        "toy_poodle": "adult poodle dog",
        "Pomeranian": "adult pomeranian dog",
        "mix": "adult_jindo_dog",
    }

    breed_eng = breed_map.get(breed_name, breed_name)
    color_eng = color_map.get(color_name, "" if color_name == "unknown" else color_name)
    prompt = (
        f"a RAW photo of {color_eng} {breed_eng}, full body, realistic, subject, "
        f"8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3"
    )
    if debug:
        logging.debug(f"[build_prompt] breed→{breed_eng}, color→{color_eng}")
        logging.debug(f"[build_prompt] prompt='{prompt}'")
    return prompt


def load_sd_pipeline(model_path: str, lora_dir: str, lora_name: str, lora_scale: float = 0.9, debug: bool = False, dbg: Optional[DebugState] = None):
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(model_path, torch_dtype=torch.float16).to("cuda")
    pipe.safety_checker = None

    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config, algorithm_type="sde-dpmsolver++", use_karras_sigmas=True
    )
    ip_adapter_scale = 0.2
    if not hasattr(pipe, "_ip_loaded"):
        pipe.load_ip_adapter("h94/IP-Adapter", subfolder="models", weight_name="ip-adapter_sd15.safetensors")
        # pipe.set_ip_adapter_scale(ip_adapter_scale)
        pipe._ip_loaded = True

    pipe.load_lora_weights(lora_dir, weight_name=lora_name)
    pipe.fuse_lora(lora_scale=lora_scale)


    if debug:
        logging.debug(f"[load_sd_pipeline] model='{model_path}', lora='{lora_name}', scale={lora_scale}")

    if dbg is not None:
        dbg.pipe_ready = True
        dbg.sd_model_path = model_path
        dbg.lora_name = lora_name
        dbg.lora_scale = lora_scale
        dbg.ip_adapter_scale = ip_adapter_scale

    return pipe


def generate_single_image(
    pipe: StableDiffusionImg2ImgPipeline,
    prompt: str,
    negative_prompt: str,
    init_image: Image.Image,
    output_dir: str,
    scale: float = 3.0,
    ref_img: str = "./process/adapter/jindo2.jpg",
    strength: float = 0.6,
    steps: int = 40,
    debug: bool = False,
    dbg: Optional[DebugState] = None,
):
    os.makedirs(output_dir, exist_ok=True)
    ref_img_pil = load_image(ref_img)

    if debug:
        logging.debug(f"[generate_single_image] output_dir={output_dir}")
        logging.debug(
            f"[generate_single_image] strength={strength}, steps={steps}, guidance_scale={scale}, ref_img={ref_img}"
        )
    seed = torch.randint(0, 2**24, (1,)).item()
    # generator = torch.Generator(device="cuda").manual_seed(seed)
    generator = torch.Generator(device="cuda").manual_seed(15948318)
    with torch.autocast("cuda"):
        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=init_image,
            strength=strength,
            guidance_scale=scale,
            num_inference_steps=steps,
            ip_adapter_image=ref_img_pil,
            ip_adapter_scale=0.2,
            generator=generator,
        )
    gen_image = result.images[0]
    gen_image_path = os.path.join(output_dir, f"img2img_seed_{seed}.png")
    gen_image.save(gen_image_path)

    if dbg is not None:
        dbg.generated = True
        dbg.gen_image_path = gen_image_path
        dbg.gen_params = {
            "strength": strength,
            "steps": steps,
            "guidance_scale": scale,
            "ip_adapter_scale": 0.2,
        }

    if debug:
        logging.debug(f"[generate_single_image] saved → {gen_image_path}")
    return gen_image, gen_image_path


# ---- Embedding (image-only) ----

def get_image_embedding_only(img_pil: Image.Image, clip_model, preprocess) -> np.ndarray:
    with torch.no_grad():
        x = preprocess(img_pil).unsqueeze(0).to(device)
        z = clip_model.encode_image(x)
        z = z / z.norm(dim=-1, keepdim=True)
    return z.detach().cpu().numpy().astype("float32")


# ---- emb2 search (image-only + Lab + breed) ----

def search_with_emb2_assets(
    crop_pil: Image.Image,
    index,  # IndexFlatIP
    ids_np: np.ndarray,
    labs_np: np.ndarray,  # (N,3)
    breeds_np: np.ndarray,  # (N,)
    clip_model,
    preprocess,
    seg_model,
    top_k: int = 5641,
    weights: SearchWeights = SearchWeights(),
    debug: bool = False,
    dbg: Optional[DebugState] = None,
    query_breed: Optional[str] = None,
    rules: 'SearchRules' = SearchRules(),     # ✅ 추가

):
    # 1) query embedding (image-only)
    with torch.no_grad():
        x = preprocess(crop_pil).unsqueeze(0).to(device)
        q = clip_model.encode_image(x)
        q = q / q.norm(dim=-1, keepdim=True)
        q = q.detach().cpu().numpy().astype("float32")
    faiss.normalize_L2(q)

    # 2) top-k cosine from FAISS
    D, I = index.search(q, top_k)

    # 3) query Lab
    qL, qa, qb = extract_query_lab(crop_pil, seg_model, debug=debug)
    qLab = np.array([qL, qa, qb], dtype=np.float32)

    # 4) merge scores
    merged = []
    
    for rank_tmp, (idx, sim) in enumerate(zip(I[0], D[0]), start=1):
        cand_lab = labs_np[idx]
        cand_breed = str(breeds_np[idx])
        dE = skcolor.deltaE_ciede2000(qLab.reshape(1, 1, 3), cand_lab.reshape(1, 1, 3)).item()
        c_sim = color_similarity_from_deltaE(dE, sigma=weights.sigma)
        b_sim = breed_similarity(query_breed, cand_breed)
        
        if rules.require_breed_match and b_sim < 1.0:
            bf = -0.3
        else:
            bf = 0.0
            
        if (c_sim < rules.min_color_sim) or (dE > rules.max_deltaE):
            cf = -0.2
        else:
            cf = 0.0
        
        final = weights.image * float(sim) + weights.color * float(c_sim) + float(bf) + float(cf)
        merged.append({
            "rank": rank_tmp,
            "id": int(ids_np[idx]),
            "img_sim": float(sim),
            "color_deltaE": float(dE),
            "color_sim": float(c_sim),
            "breed_sim": float(b_sim),
            "final_score": float(final),
            "q_breed": query_breed,     
            "c_breed": cand_breed,     
        })

    merged.sort(key=lambda x: x["final_score"], reverse=True)

    for i, m in enumerate(merged, start=1):
        m["rank"] = i

    if dbg is not None:
        dbg.faiss_top = [{"rank": m["rank"], "id": m["id"], "similarity": m["final_score"]} for m in merged[:10]]

    if debug:
        head = ", ".join([
            f"#{m['rank']} id={m['id']} F={m['final_score']:.3f} "
            f"(img={m['img_sim']:.3f}, c={m['color_sim']:.3f}, b={m['breed_sim']:.1f}, dE={m['color_deltaE']:.1f}, "
            f"qb={m['q_breed']}, cb={m['c_breed']})"
            for m in merged[:10]
        ])
        logging.debug(f"[emb2] merged top10: {head}")

    return merged


# ---- Visualization ----

def visualize_results(query_img: Image.Image, results: List[Dict[str, Any]], base_dir: str, save_path: str, top_k_show: int = 14):
    total_images = 1 + min(top_k_show, len(results))
    cols = 5
    rows = math.ceil(total_images / cols)

    plt.figure(figsize=(20, 4 * rows))

    # Query
    plt.subplot(rows, cols, 1)
    plt.imshow(query_img)
    plt.axis("off")
    plt.title("Query Image", fontsize=12)

    # Results
    for i, item in enumerate(results[:top_k_show], start=2):
        img_id = item["id"]
        img_path = os.path.join(base_dir, f"{img_id}.jpg")
        if not os.path.exists(img_path):
            logging.warning(f"이미지 없음: {img_path}")
            continue
        img = Image.open(img_path).convert("RGB")
        plt.subplot(rows, cols, i)
        plt.imshow(img)
        plt.axis("off")
        plt.title(
            f"Rank {item['rank']}\n"
            f"Final {item.get('final_score',0):.3f}\n"
            f"Img {item.get('img_sim',0):.3f}, C {item.get('color_sim',0):.3f}, B {item.get('breed_sim',0):.1f}\n"
            f"{item.get('q_breed','?')} → {item.get('c_breed','?')}\n"
            f"{img_id}",
            fontsize=9,
        )


    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    logging.info(f"✅ 시각화 저장: {save_path}")


# ---- Query prep (generation optional) ----

def prepare_query_image(latest_file: str, generate: bool, debug: bool, dbg: DebugState):
    init_image_pil = Image.open(latest_file).convert("RGB").resize((512, 512))
    init_image_np = np.array(init_image_pil)

    if not generate:
        logging.info("[prepare] Search only (no generation)")
        dbg.search_image_path = latest_file
        return init_image_pil, latest_file

    # generation path
    logging.info("[prepare] Generate → then search")

    # 1) seg & color
    mask_3ch = get_mask(seg_model, init_image_pil, debug=debug)
    if mask_3ch is None:
        logging.warning("Segmentation 실패 → 색상 추정 스킵")
        predicted_color = ""
        dbg.seg_ok = False
    else:
        masked_img = apply_chroma_background(init_image_np, mask_3ch)
        top_colors = analyze_colors(masked_img, top_n=4, debug=debug)
        dbg.top_colors = [(rgb.tolist(), ratio) for rgb, ratio in top_colors]
        top1_bgr, _ = top_colors[0]
        # convert BGR → RGB for classify_color
        rgb = (int(top1_bgr[2]), int(top1_bgr[1]), int(top1_bgr[0]))
        predicted_color = classify_color(rgb, debug=debug)
        dbg.seg_ok = True
    dbg.predicted_color = predicted_color

    # 2) breed
    breed_name, breed_conf = classify_breed(init_image_pil, model_path="./process/model/detect6.pt", debug=debug, det_state=dbg)
    dbg.breed_name, dbg.breed_conf = breed_name, breed_conf

    # 3) prompt
    prompt = build_prompt(breed_name, predicted_color, debug=debug)
    negative_prompt = "(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime,low quality:1.4)) text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, UnrealisticDream"

    dbg.prompt, dbg.negative_prompt = prompt, negative_prompt

    # 4) lora select
    if breed_name in ("Jindo-dog", "Jindo-puppy", "mix"):
        lora_name, lora_scale = "7000.safetensors", 0.4
        # 색상과 이미지 경로를 짝지어 둡니다.
        color_path_map = {
            "white": "./process/adapter/jindo2.jpg",
            "light brown": "./process/adapter/jindo33.jpg",
            "brown": "./process/adapter/jindo3.jpg",
            "black": "./process/adapter/e.jpg"
        }

        # predicted_color 값에 해당하는 경로를 딕셔너리에서 바로 찾습니다.
        # .get() 메서드는 키가 없을 경우를 대비해 기본값을 설정할 수 있어 안전합니다.
        ref_img = color_path_map.get(predicted_color, "./process./adapter/white_img.jpg")

    elif breed_name == "Pomeranian":
        lora_name, lora_scale, ref_img = "pome2000.safetensors", 0.6, "./process/adapter/wpome.jpg"

    elif breed_name == "toy_poodle":
        lora_name, lora_scale, ref_img = "poo1000.safetensors", 0.6, "./process/adapter/poo3.jpg"
    else:
        logging.warning("LoRA 선택 실패 → fallback")
        lora_name, lora_scale, ref_img = "all2_4000.safetensors", 0.9, "./process/adapter/wpome.jpg"
    dbg.lora_name, dbg.lora_scale, dbg.ref_img = lora_name, lora_scale, ref_img

    # 5) pipeline

    pipe = load_sd_pipeline(
        model_path="./process/converted-model/realistic-hypervae",
        lora_dir="./process/lora/",
        lora_name=lora_name,
        lora_scale=lora_scale,
        debug=debug,
        dbg=dbg,
    )

    # 6) generatec
    strength = 0.6
    if breed_name == "Jindo-dog":
        strength = 0.7
    if breed_name == "toy_poodle":
        strength = 0.55
    gen_image, gen_image_path = generate_single_image(
        pipe=pipe,
        prompt=prompt,
        negative_prompt=negative_prompt,
        init_image=init_image_pil,
        output_dir="./process/output",
        ref_img=ref_img,
        strength=strength,
        scale=4.0,
        steps=40,
        debug=debug,
        dbg=dbg,
    )

    dbg.search_image_path = gen_image_path
    dbg.output_dir = "./process/output"
    return gen_image, gen_image_path


# ================================
# Main runner
# ================================

def run_main(
    image_path: Optional[str] = None,
    upload_dir: str = "./static/upload",
    generate: bool = False,
    debug: bool = False,
    spring_url: Optional[str] = "http://localhost:8080/search-result",
    top_k: int = 50,
    base_dir_for_vis: str = "./all",
    visualize: bool = False,
    top_k_faiss = 5641, 


    # emb2 assets
    emb2_index_path: str = "./process/CLIP/dog_index_img.faiss",
    emb2_ids_path: str = "./process/CLIP/dog_ids_img.npy",
    emb2_colors_lab_path: str = "./process/CLIP/dog_colors_lab.npy",
    emb2_breeds_path: str = "./process/CLIP/dog_breeds.npy",
    weights: SearchWeights = SearchWeights(),
    rules: 'SearchRules' = SearchRules(),     # ✅ 추가

) -> Dict[str, Any]:
    """Entry point (emb2-only)"""
    setup_logger(debug)
    dbg = DebugState()

    # Select input image
    if image_path is None:
        image_files = [f for f in glob.glob(os.path.join(upload_dir, "*.*")) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        if not image_files:
            raise FileNotFoundError("업로드 폴더에 이미지가 없습니다.")
        latest_file = max(image_files, key=os.path.getmtime)
    else:
        latest_file = image_path
        if not os.path.exists(latest_file):
            raise FileNotFoundError(f"입력 이미지가 존재하지 않습니다: {latest_file}")

    dbg.latest_file = latest_file
    logging.info(f"[run_main] Input image: {latest_file}")

    # Prepare query image (with or without generation)
    query_img, search_image_path = prepare_query_image(latest_file, generate, debug, dbg)

    # ---- emb2 search (always) ----
    index = faiss.read_index(emb2_index_path)
    ids_np = np.load(emb2_ids_path)
    labs_np = np.load(emb2_colors_lab_path)
    breeds_np = np.load(emb2_breeds_path)

    # detect for crop + breed for query
    orig = cv2.imread(search_image_path)
    results = detect_model(search_image_path)
    if not results or not results[0].boxes:
        crop_pil = Image.open(search_image_path).convert("RGB").resize((512, 512))
        breed_used = ""
    else:
        boxes = results[0].boxes
        confs = [float(b.conf[0]) for b in boxes]
        best_idx = int(np.argmax(confs))
        box = boxes[best_idx]
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        crop = orig[y1:y2, x1:x2]
        crop_pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)).resize((512, 512))
        breed_used = results[0].names[int(boxes[best_idx].cls[0])]

    merged = search_with_emb2_assets(
        crop_pil=crop_pil,
        index=index,
        ids_np=ids_np,
        labs_np=labs_np,
        breeds_np=breeds_np,
        clip_model=clip_model,
        preprocess=preprocess,
        seg_model=seg_model,
        top_k=top_k_faiss,
        weights=weights,
        debug=debug,
        dbg=dbg,
        query_breed=breed_used,
        rules=rules,                # ✅ 추가
    )
    final_results = merged[:top_k]
    results_list = [{
        "rank": m["rank"],
        "id": m["id"],
        "similarity": m["final_score"],   # ✅ 추가
        "img_sim": m["img_sim"],
        "color_sim": m["color_sim"],
        "deltaE": m["color_deltaE"],
        "breed_sim": m["breed_sim"],   # ✅ 추가
        "q_breed": m["q_breed"],       # ✅ 추가
        "c_breed": m["c_breed"],       # ✅ 추가
    } for m in final_results]

    dbg.top_k = top_k

    # Save results JSON
    save_path = "./process/output/search_results.json"
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(results_list, f, ensure_ascii=False, indent=2)

    # Optional POST to Spring
    post_ok = False
    post_status = None
    post_text = None
    if spring_url:
        import requests
        files = {"image": open(search_image_path, "rb")}
        data = {"result": json.dumps(results_list, ensure_ascii=False, indent=2)}
        logging.info(f"[run_main] POST → {spring_url}")
        try:
            resp = requests.post(spring_url, files=files, data=data, timeout=15)
            post_ok = resp.ok
            post_status = resp.status_code
            post_text = resp.text[:500]
            logging.info(f"✅ Spring 응답: {resp.status_code} - {resp.text[:200]}")
        except Exception as e:
            logging.error(f"❌ 전송 실패: {e}")
            logging.info("서버 미동작 → 결과는 로컬 JSON으로만 저장합니다.")

    # Optional visualization
    vis_path = None
    if visualize or (debug and not post_ok):
        vis_path = "./process/output/result_vis.png"
        visualize_results(query_img, results_list, base_dir_for_vis, vis_path, top_k_show=min(14, len(results_list)))

    # Debug summary
    dbg.summary()

    # Return payload
    return {
        "input_image": latest_file,
        "search_image": search_image_path,
        "results": results_list,
        "result_json": save_path,
        "visualization": vis_path,
        "post_ok": post_ok,
        "post_status": post_status,
        "post_preview": post_text,
        "color_used": "",  # not used in emb2 return (use deltaE/color_sim)
        "breed_used": breed_used,
        "debug": dbg.__dict__,
    }


# ================================
# CLI (emb2-only)
# ================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true", help="Add image generation process")
    parser.add_argument("--debug", action="store_true", help="Enable verbose debug logs")
    parser.add_argument("--image", type=str, default=None, help="특정 이미지 경로(없으면 최신 업로드 사용)")
    parser.add_argument("--no-post", action="store_true", help="Spring 전송 생략")
    parser.add_argument("--visualize", action="store_true", help="로컬 시각화 PNG 저장")
    parser.add_argument("--spring-url", type=str, default="http://localhost:8080/search-result")
    parser.add_argument("--top-k", type=int, default=50)
    parser.add_argument("--upload-dir", type=str, default="./static/upload")
    parser.add_argument("--base-vis", type=str, default="./all")

    # weights
    parser.add_argument("--w-image", type=float, default=0.6)
    parser.add_argument("--w-color", type=float, default=0.2)
    parser.add_argument("--w-breed", type=float, default=0.2)
    parser.add_argument("--color-sigma", type=float, default=10.0)

    # emb2 assets
    parser.add_argument("--emb2-index", type=str, default="./process/CLIP/dog_index_img.faiss")
    parser.add_argument("--emb2-ids", type=str, default="./process/CLIP/dog_ids_img.npy")
    parser.add_argument("--emb2-lab", type=str, default="./process/CLIP/dog_colors_lab.npy")
    parser.add_argument("--emb2-breeds", type=str, default="./process/CLIP/dog_breeds.npy")

    args = parser.parse_args()

    payload = run_main(
        image_path=args.image,
        upload_dir=args.upload_dir,
        generate=args.generate,
        debug=args.debug,
        spring_url=None if args.no_post else args.spring_url,
        top_k=args.top_k,
        base_dir_for_vis=args.base_vis,
        visualize=args.visualize or args.debug,
        emb2_index_path=args.emb2_index,
        emb2_ids_path=args.emb2_ids,
        emb2_colors_lab_path=args.emb2_lab,
        emb2_breeds_path=args.emb2_breeds,
        weights=SearchWeights(image=args.w_image, color=args.w_color, breed=args.w_breed, sigma=args.color_sigma),
    )



    # If you want to print: uncomment below
    # import pprint; pprint.pprint(payload)
