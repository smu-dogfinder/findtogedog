import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from "@/components/Breadcrumb";
import styles from '@/styles/pages/detail.module.css'; // .module.css 파일 임포트

export default function SearchResultPage() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [dogs, setDogs] = useState([]);

  // 저장된 결과 불러오기
  useEffect(() => {
    const saved = sessionStorage.getItem("aiImageSearchData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreviewUrl(parsed.previewUrl || null);
        setGeneratedPreview(parsed.generatedPreview || null);
        setDogs(parsed.dogs || []);
      } catch {
        sessionStorage.removeItem("aiImageSearchData");
        navigate("/lookup/predict-dog", { replace: true });
      }
    } else {
      navigate("/lookup/predict-dog", { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <Banner text="유사 유기견 결과" />
      <Breadcrumb />

      <div className={styles.resultContainer}>
        <button
          onClick={() => navigate('/lookup/predict-dog')}
          className={`${styles.btn} ${styles.btnOutline}`}
        >
          {'<'} 검색 페이지로 돌아가기
        </button>

        <h1>검색 결과</h1>

        <div className={styles.previewSection}>
          <div className={styles.card}>
            <div>업로드한 사진</div>
            {previewUrl &&
              <img
                src={previewUrl}
                alt="preview"
                className={styles.cardImage}
              />
            }
          </div>

          <div className={styles.arrow}>
            →
          </div>

          <div className={styles.card}>
            <div>예측된 성견 모습</div>
            {generatedPreview && (
              <img
                src={`data:image/jpeg;base64,${generatedPreview}`}
                alt="Generated"
                className={styles.cardImage}
              />
            )}
          </div>
        </div>

        {dogs.length > 0 ? (
          <div>
            <h3>유사한 유기견 목록</h3>
            <div className={styles.dogGrid}>
              {dogs.map((dog) => (
                <Link
                  key={dog.id}
                  to={`/lookup/predict-dog/${dog.id}`}
                  state={{ from: "/lookup/search-result" }}
                  className={styles.dogCardLink}
                >
                  <div className={styles.dogCard}>
                    <img
                      src={dog.imagePath || "/default-dog.jpg"}
                      alt="dog"
                      className={styles.dogCardImage}
                    />
                    <h3 className={styles.dogCardTitle}>
                      {dog.species} {dog.gender}
                    </h3>
                    <p className={styles.dogCardDesc}>
                      {dog.shelterId} <br /> {dog.state}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ marginTop: "2rem" }}>검색된 유기견이 없습니다.</p>
        )}
      </div>
    </div>
  );
}