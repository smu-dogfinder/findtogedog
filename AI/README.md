# 함께찾개 AI 서비스

업로드한 강아지 사진이나 생성한 성견 예상 이미지를 기준으로 유사한 유기견을 검색합니다. [Spring Boot 백엔드](../Backend/README.md)가 업로드를 전달하고 검색 결과를 받아 동물 상세 정보와 결합합니다.

## 이미지 처리와 검색

- YOLO로 품종을 분류하고 배경을 분리합니다. 대표 색상을 추출하고 CIELAB 색 공간의 색상 차이를 검색 점수에 반영합니다.
- 성견 예상 이미지는 Stable Diffusion 이미지 변환 파이프라인에서 품종별 LoRA와 IP-Adapter를 사용해 생성합니다.
- CLIP ViT-B/32로 이미지 임베딩을 만든 뒤 FAISS 인덱스에서 후보를 찾습니다. 이미지 유사도, 색상, 품종 점수의 가중치는 검색 설정으로 조정할 수 있습니다.

## 로컬 실행

저장소 루트에서 `AI`로 이동한 뒤 해당 폴더를 작업 디렉터리로 사용합니다. 모델과 인덱스는 현재 디렉터리 기준의 상대 경로에서 읽습니다.

```bash
cd AI
python -m venv .venv
# 가상환경을 활성화한 뒤 설치
python -m pip install -r requirements.txt
```

[requirements.txt](requirements.txt)는 기존 환경의 고정 버전 목록으로, Windows 전용 패키지와 CUDA 11.8용 PyTorch 빌드를 포함합니다. 운영체제와 GPU 환경에 맞는 패키지 인덱스와 배포판으로 설치해야 합니다. 성견 이미지 생성 코드는 CUDA 지원 GPU를 사용합니다.

실행 전에 아래 모델과 인덱스를 준비하세요. 예제 사진은 저장소에 있으며 모델 가중치와 인덱스는 별도 파일입니다.

| 경로 | 용도 |
| --- | --- |
| `process/model/seg.pt`, `0818.pt`, `detect6.pt` | YOLO 분할 및 품종 분류 |
| `process/converted-model/realistic-hypervae/` | Stable Diffusion 모델 |
| `process/lora/` | 이미지 생성에 쓰는 LoRA 가중치 |
| `process/CLIP/dog_index_img.faiss` | 이미지 검색 인덱스 |
| `process/CLIP/dog_ids_img.npy`, `dog_colors_lab.npy`, `dog_breeds.npy` | 인덱스와 순서가 일치하는 동물 ID, 색상, 품종 |

[app.py](app.py)를 `python app.py`로 실행하면 Flask 개발 서버가 로컬 포트 `5000`에서 시작합니다. 디버그 모드가 켜져 있으므로 로컬 개발 환경에서 사용하세요. [Kubernetes 매니페스트](k8s/)의 컨테이너 및 서비스 포트는 `8000`이며, 배포 이미지 내부의 실행 설정과 맞아야 합니다.

## HTTP API

두 경로 모두 `multipart/form-data`의 `image` 필드로 파일을 받습니다.

| 메서드와 경로 | 처리 |
| --- | --- |
| `POST /search/uploaded` | 업로드 사진으로 유사 이미지 검색 |
| `POST /search/generated` | 성견 예상 이미지 생성 후 생성 이미지로 유사 이미지 검색 |

선택적 쿼리 파라미터는 `w_img`, `w_color`, `w_breed`, `sigma`입니다. 성공 응답에는 `status`, `results`, 사용한 이미지의 Base64 값인 `image`, `visualization`, `breed_used`, `color_used`가 포함됩니다.

## 명령줄 실행

[main.py](main.py)는 모델 로딩, 이미지 생성, 검색, 결과 저장을 담당합니다. `--no-post`를 사용하면 Spring 서버로 결과를 보내지 않고 로컬에서 분석할 수 있습니다.

```bash
python main.py --image path/to/image.jpg --no-post
python main.py --image path/to/image.jpg --generate --no-post
```

검색 결과는 `process/output/search_results.json`에 저장됩니다.
