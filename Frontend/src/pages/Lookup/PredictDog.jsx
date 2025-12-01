import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from "@/components/Breadcrumb";
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

export default function PredictDog() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    sessionStorage.removeItem("aiImageSearchData");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      sessionStorage.removeItem("aiImageSearchData");
      setSelectedFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleSearchClick = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("이미지를 업로드해주세요.");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch(`/api/search/generated`, {
        method: "POST",
        body: formData,
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      if (!res.ok) {
        throw new Error(`응답 실패: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ 검색 응답:", data);

      // 결과 저장
      const dataToSave = {
        previewUrl,
        generatedPreview: data.generatedImageBase64 || null,
        dogs: data.dogs || [],
      };
      sessionStorage.setItem("aiImageSearchData", JSON.stringify(dataToSave));

      // 페이지 이동
      navigate('/lookup/search-result');
    } catch (error) {
      console.error("❌ 검색 요청 오류:", error);
      alert("예측에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div>
      <div className={styles.bannerWrap}>
        {/* 상단 배너 */}
        <Banner
          text="성견 모습 예측하여 유기견 찾기"
        />
      </div>

      <Breadcrumb />

      <div className={styles.pageWrap}>
        <h1 className={styles.pageTitle}>어린 강아지의 성견 모습 예측하기</h1>
        <p className={styles.helperText}>어린 강아지의 사진을 업로드하면 성견 모습을 AI가 예측하고, 유사한 유기견 목록도 함께 보여줍니다.</p>

        <form onSubmit={handleSearchClick}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={classNames(styles.uploader, {
              [styles.uploaderActive]: dragOver,
            })}
          >
            <p className={selectedFile ? styles.helperText : ''}>
              {selectedFile ? '이미지가 업로드되었습니다. 다시 업로드하려면 클릭 또는 드래그하세요.'
              : '이미지를 드래그하거나 클릭하여 업로드하세요.'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {previewUrl && (
            <div style={{ marginTop: '1rem' }}>
              <p>업로드한 사진:</p>
              <img src={previewUrl} alt="preview" className={styles.uploaderImg} />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={classNames(styles.btn, styles.btnPrimary, styles.btnAnimated)}
          >
            {isLoading ? '예측 중...' : '성견 모습 예측 및  검색'}
          </button>
        </form>
      </div>
    </div>
  );
}