#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Flask app
- Endpoints: /search/generated, /search/uploaded
- Returns JSON: {status, results, image(base64)}
"""

import os
os.environ["MPLBACKEND"] = "Agg"  # must be set before importing pyplot anywhere

from flask import Flask, render_template, request, jsonify
import base64

# Import from main module
from main import run_main, SearchWeights 

app = Flask(__name__)

UPLOAD_DIR = "./static/upload"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_upload(file_storage) -> str:
    """Save an uploaded file into UPLOAD_DIR and return its full path."""
    filename = file_storage.filename
    if not filename:
        raise ValueError("파일명이 비어있습니다.")
    save_path = os.path.join(UPLOAD_DIR, filename)
    file_storage.save(save_path)
    return save_path


def _payload_to_response(payload: dict) -> dict:
    """Build JSON-friendly response with base64 image of the query/used image."""
    img_path = payload.get("search_image") or payload.get("input_image")
    image_b64 = None
    if img_path and os.path.exists(img_path):
        with open(img_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")
    return {
        "status": "ok",
        "results": payload.get("results", []),
        "image": image_b64,
        "visualization": payload.get("visualization"),  # path if generated
        "breed_used": payload.get("breed_used"),
        "color_used": payload.get("color_used"),
    }


@app.route("/")
def index():
    return render_template("main.html", message="")


@app.route("/search/generated", methods=["POST"])
def search_generated():
    if "image" not in request.files:
        return jsonify({"status": "error", "message": "이미지 파일이 없습니다."}), 400
    save_path = _save_upload(request.files["image"])

    # weights via query params
    w_img = float(request.args.get("w_img", 0.85))
    w_color = float(request.args.get("w_color", 0.15))
    w_breed = float(request.args.get("w_breed", 0.0))
    sigma = float(request.args.get("sigma", 10.0))
    weights = SearchWeights(image=w_img, color=w_color, breed=w_breed, sigma=sigma)

    payload = run_main(
        image_path=save_path,
        generate=True,
        debug=True,
        spring_url=None,    # Flask responds directly
        top_k=50,
        base_dir_for_vis="./all",   # 디버깅 때 시각화를 위한 DB 이미지 저장 경로
        visualize=False,
        weights=weights,
    )

    return jsonify(_payload_to_response(payload))


@app.route("/search/uploaded", methods=["POST"])
def search_uploaded():
    if "image" not in request.files:
        return jsonify({"status": "error", "message": "이미지 파일이 없습니다."}), 400
    save_path = _save_upload(request.files["image"])

    w_img = float(request.args.get("w_img", 0.85))
    w_color = float(request.args.get("w_color", 0.15))
    w_breed = float(request.args.get("w_breed", 0.0))
    sigma = float(request.args.get("sigma", 10.0))
    weights = SearchWeights(image=w_img, color=w_color, breed=w_breed, sigma=sigma)

    payload = run_main(
        image_path=save_path,
        generate=False,
        debug=True,
        spring_url=None,
        top_k=50,
        base_dir_for_vis="./all",
        visualize=False,
        weights=weights,
    )

    return jsonify(_payload_to_response(payload))




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
