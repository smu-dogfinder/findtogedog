import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import { regionData } from '../../utils/regionData';
import Banner from '../../components/Mainpage/Banner';
import Breadcrumb from '../../components/Breadcrumb';
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

const districtList = regionData['경기도'];

export default function AdoptMain() {
  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [breed, setBreed] = useState('');
  const [keyword, setKeyword] = useState('');

  const [speciesList, setSpeciesList] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const pageLimit = 5;
  const [totalItems, setTotalItems] = useState(0);

  // 품종 리스트 불러오기
  useEffect(() => {
    axios
      .get(`/api/dog-details/breeds`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      .then((res) => setSpeciesList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSpeciesList([]));
  }, []);

  // 전체 보호중 데이터 초기 로드
  useEffect(() => {
    fetchAllDogs();
  }, []);

  const fetchAllDogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/dog-details/paged`, {
        params: { page: 0, size: 10000 },
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      // 보호중만 필터링
      const adoptable = list.filter((dog) =>
        (dog?.state || '').includes('보호중')
      );
      setResults(adoptable);
      setTotalItems(adoptable.length);
      setCurrentPage(1);
    } catch {
      setResults([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        species: breed || undefined,
        jurisd: selectedDistrict ? `경기도 ${selectedDistrict}` : '경기도',
        keyword: keyword || undefined,
        page: 0,
        size: 10000,
      };

      const res = await axios.get(`/api/dog-details/paged`, {
        params,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      // 보호중만 필터링
      const adoptable = list.filter((dog) =>
        (dog?.state || '').includes('보호중')
      );
      setResults(adoptable);
      setTotalItems(adoptable.length);
      setCurrentPage(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setResults([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const onKeyEnter = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(results.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = results.slice(startIndex, startIndex + itemsPerPage);
  const startPage = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1;
  const endPage = Math.min(startPage + pageLimit - 1, totalPages);

  return (
    <div>
      <div className={styles.bannerWrap}>
        <Banner text="유기견 입양 전체보기" />
      </div>
      <Breadcrumb />

      <div className={styles.pageWrap}>
        <h2 className={styles.pageTitle}>입양 가능한 유기견 보기</h2>

        <div
          className={classNames(styles.rowSpread, styles.sectionGap)} // classnames 적용
          style={{ marginBottom: '1.7rem' }}
        >
          <div>
            전체 <strong className={styles.countBadge}>{totalItems}</strong> 건
          </div>
        </div>

        <div className={styles.row} style={{ marginBottom: '1.5rem' }}>
          <span title="입양 가능 조건: 보호중 상태" className={styles.badgeAdopt}>
            ● 보호중만 표시
          </span>

          <select className={styles.select} value="경기도" disabled>
            <option value="경기도">경기도</option>
          </select>

          <select
            className={styles.select}
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="">시/군 선택</option>
            {districtList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          >
            <option value="">품종 선택</option>
            {speciesList.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            className={styles.input}
            type="text"
            placeholder="검색어 입력"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={onKeyEnter}
          />

          <button
            className={classNames(styles.btn, styles.btnPrimary, styles.adopt, styles.btnAnimated)} // classnames 적용
            onClick={handleSearch}
          >
            검색
          </button>
        </div>

        <div className={styles.sectionGap}>
          {loading ? (
            <p className={styles.helperText}>로딩 중...</p>
          ) : currentResults.length === 0 ? (
            <p className={styles.muted}>입양 가능한(보호중) 유기견이 없습니다.</p>
          ) : (
            <div className={styles.cardGrid}>
              {currentResults.map((dog) => (
                <div key={dog.id} className={classNames(styles.card, styles.cardTall)}>
                  <img
                    className={styles.cardImg}
                    src={dog.imagePath || '/default-dog.jpg'}
                    alt="dog"
                  />
                  <h3 className={styles.cardTitle}>
                    {dog.species} {dog.gender}
                  </h3>
                  <p className={styles.cardDesc}>
                    {dog.jurisd || dog.shelterId} <br /> {dog.state}
                  </p>
                  <button
                    className={styles.cardBtn}
                    onClick={() =>
                      navigate(`/adopt/${dog.id}`, { state: { from: '/adopt' } })
                    }
                  >
                    상세보기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            {startPage > 1 && (
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(startPage - 1)}
              >
                &lt;
              </button>
            )}
            {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const pageNum = startPage + i;
              return (
                <button
                  key={pageNum}
                  className={classNames(styles.pageBtn, {
                    [styles.pageBtnActive]: currentPage === pageNum,
                  })}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            {endPage < totalPages && (
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(endPage + 1)}
              >
                &gt;
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.noticeFooter}>
        ※ 본 사이트는 입양 절차를 직접 진행하지 않으며, 입양 가능한 보호소 또는
        운영기관의 연락처 및 주소만 제공한다는 점을 알립니다. ※
      </div>
    </div>
  );
}