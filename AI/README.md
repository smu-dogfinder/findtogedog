# 개 품종 검색 및 이미지 생성 시스템

## 프로젝트 개요
YOLOv8, CLIP, Stable Diffusion을 활용한 개 품종 검색 및 이미지 생성 시스템입니다. 업로드된 개 이미지를 분석하여 유사한 품종의 개를 찾고, 필요시 AI 이미지 생성 기능을 제공합니다.

## 주요 기능
- 개 품종 자동 인식 (YOLO)
- 색상 분석 및 분류
- CLIP 기반 유사 이미지 검색
- Stable Diffusion 기반 이미지 생성
- Flask 웹 API 제공

## 설치 방법

### 1. Python 환경 설정
```bash
# Python 3.8+ 설치 확인
python --version

# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 모델 파일
이 프로젝트는 다음 모델 파일들을 사용합니다:

- **YOLO 모델들** (`process/model/` 폴더)
- **Stable Diffusion 모델** (`process/converted-model/` 폴더)  
- **LoRA 가중치들** (`process/lora/` 폴더)
- **FAISS 검색 인덱스들** (`process/CLIP/` 폴더)

**주의**: 대용량 모델 파일들은 Git에 포함되지 않습니다. 로컬 환경에서만 사용 가능합니다.

## 사용법

### 웹 서버 실행
```bash
python app.py
```

### CLI 사용
```bash
# 이미지 생성 후 검색
python main.py --image path/to/image.jpg --generate

# 업로드된 이미지로만 검색
python main.py --image path/to/image.jpg

# 디버그 모드
python main.py --image path/to/image.jpg --debug --visualize
```

## API 엔드포인트

### POST /search/generated
이미지 생성 후 유사 이미지 검색
- **입력**: 이미지 파일
- **출력**: JSON 형태의 검색 결과

### POST /search/uploaded
업로드된 이미지로 직접 검색
- **입력**: 이미지 파일
- **출력**: JSON 형태의 검색 결과

## 프로젝트 구조
```
AI/
├── main.py              # 메인 검색 및 생성 로직
├── app.py               # Flask 웹 애플리케이션
├── requirements.txt     # Python 의존성
├── process/
│   ├── adapter/         # 샘플 이미지들
│   ├── input/           # 테스트 이미지들
│   ├── model/           # YOLO 모델들 (다운로드 필요)
│   ├── lora/            # LoRA 가중치들 (다운로드 필요)
│   ├── CLIP/            # FAISS 인덱스들 (다운로드 필요)
└── └── converted-model/ # Stable Diffusion 모델 (다운로드 필요)
 
```

## 주의사항
- 대용량 모델 파일들은 Git에 포함되지 않습니다
- 모델 파일들은 따로 구하셔야 합니다

