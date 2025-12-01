import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { regionData } from '@/utils/regionData';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

const districtList = regionData['경기도'];

export default function LookupMain() {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [breed, setBreed] = useState('');
  const [keyword, setKeyword] = useState('');
  const [imageFilter, setImageFilter] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [results, setResults] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ✅ 실제 검색에 사용될 값 (이 상태들이 변경될 때만 필터링이 일어납니다)
  const [appliedBreed, setAppliedBreed] = useState('');
  const [appliedDistrict, setAppliedDistrict] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const itemsPerPage = 9;
  const pageLimit = 5;
  const fileInputRef = useRef();

  // 모든 강아지 데이터 불러오기 또는 세션스토리지에서 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('lookupSearchState');
    const visited = sessionStorage.getItem('visitedByBack');

    if (saved && visited === 'true') {
      try {
        const parsed = JSON.parse(saved);
        setBreed(parsed.breed || '');
        setSelectedDistrict(parsed.selectedDistrict || '');
        setKeyword(parsed.keyword || '');
        setResults(parsed.results || []);
        setCurrentPage(parsed.currentPage || 1);
        setTotalItems(parsed.results?.length || 0);

        // ✅ 복원할 때는 applied 값도 맞춰줌
        setAppliedBreed(parsed.breed || '');
        setAppliedDistrict(parsed.selectedDistrict || '');
        setAppliedKeyword(parsed.keyword || '');

        const previewUrl = sessionStorage.getItem('lookupImagePreview');
        if (previewUrl) setImagePreview(previewUrl);

        setTimeout(() => sessionStorage.removeItem('visitedByBack'), 0);
      } catch {
        sessionStorage.removeItem('lookupSearchState');
      }
    } else {
      fetchAllDogs();
    }
  }, []);

  // 품종 목록 불러오기 (초기 렌더링 시 1회)
  useEffect(() => {
    axios
      .get(`/api/dog-details/breeds`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      .then((res) => setSpeciesList(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSpeciesList([]));
  }, []);

  const fetchAllDogs = async () => {
    try {
      const res = await axios.get(`/api/dog-details/paged`, {
        params: { page: 0, size: 10000 },
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setResults(data);
      setTotalItems(data.length);
      // 초기에는 검색 조건이 없으므로 applied 상태도 초기화
      setAppliedBreed('');
      setAppliedDistrict('');
      setAppliedKeyword('');
    } catch {
      setResults([]);
      setTotalItems(0);
    }
  };

  const handleSearch = async () => {
    try {
      // ✅ 검색 버튼을 누를 때만 applied 값을 갱신합니다.
      setAppliedBreed(breed);
      setAppliedDistrict(selectedDistrict);
      setAppliedKeyword(keyword);

      const params = {
        species: breed || undefined,
        jurisd: selectedDistrict ? `경기도 ${selectedDistrict}` : undefined,
        keyword: keyword || undefined,
        page: 0,
        size: 10000,
      };

      let list = [];
      if (imageFilter) {
        const formData = new FormData();
        formData.append('image', imageFilter);
        if (breed) formData.append('species', breed);
        if (selectedDistrict) formData.append('jurisd', `경기도 ${selectedDistrict}`);
        if (keyword) formData.append('keyword', keyword);

        const res = await fetch(`/api/search/image`, {
          method: 'POST',
          body: formData,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const data = await res.json();
        list = Array.isArray(data.dogs) ? data.dogs : [];
      } else {
        const res = await axios.get(`/api/dog-details/paged`, {
          params,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        list = Array.isArray(res.data?.data) ? res.data.data : [];
      }

      setResults(list);
      setCurrentPage(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      alert('검색 중 오류가 발생했습니다.');
      setResults([]);
    }
  };

  const onKeyEnter = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFilter(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFilter(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ✅ applied 상태가 변경될 때마다 이 변수가 다시 계산됩니다.
  const filteredResults = results
    .filter((dog) => (appliedBreed ? dog.species?.includes(appliedBreed) : true))
    .filter((dog) => (appliedDistrict ? dog.jurisd?.includes(appliedDistrict) : true))
    .filter((dog) =>
      appliedKeyword
        ? (dog.species?.includes(appliedKeyword) ||
           dog.jurisd?.includes(appliedKeyword) ||
          //  dog.name?.includes(appliedKeyword) ||
           dog.color?.includes(appliedKeyword) ||
          //  dog.specialMark?.includes(appliedKeyword) ||
          //  dog.shelterName?.includes(appliedKeyword) ||
           dog.state?.includes(appliedKeyword) ||
           dog.gender?.includes(appliedKeyword))
        : true
    );
    
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);
  const startPage = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1;
  const endPage = Math.min(startPage + pageLimit - 1, totalPages);

  return (
    <div>
      <div className={styles.bannerWrap}>
        <Banner text="유기견 조회 전체보기" />
      </div>
      <Breadcrumb />

      <div className={styles.pageWrap}>
        <h2 className={styles.pageTitle}>유기견 검색</h2>

        <div className={classNames(styles.rowSpread, styles.sectionGap)} style={{ marginBottom: '1.7rem' }}>
          <div>
            전체 <strong className={styles.countBadge}>{filteredResults.length}</strong> 건
          </div>
        </div>

        <div className={styles.row} style={{ marginBottom: '1.5rem' }}>
          <select className={styles.select} value="경기도" disabled>
            <option value="경기도">경기도</option>
          </select>

          <select
            className={styles.select}
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            onKeyDown={onKeyEnter}
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
            onKeyDown={onKeyEnter}
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

          <button className={classNames(styles.btn, styles.btnPrimary, styles.lookup, styles.btnAnimated)} onClick={handleSearch}>
            검색
          </button>

          <button
            className={classNames(styles.btn, styles.btnGhost)}
            onClick={() => setShowImageUpload((v) => !v)}
          >
            {showImageUpload ? '닫기' : '사진으로 찾기'}
          </button>
        </div>

        {showImageUpload && (
          <div
            className={classNames(styles.uploader, {
              [styles.uploaderActive]: dragOver,
            })}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className={imageFilter ? styles.helperText : ''}>
              {imageFilter
                ? '다른 이미지를 업로드하려면 다시 드래그하거나 클릭하세요.'
                : '이미지를 드래그하거나 클릭하여 업로드하세요.'}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            {imagePreview && (
              <div className={styles.uploaderPreview}>
                <img className={styles.uploaderImg} src={imagePreview} alt="preview" />
                <div>
                  <button
                    className={styles.uploaderDel}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFilter(null);
                      setImagePreview(null);
                      sessionStorage.removeItem('lookupImagePreview');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    이미지 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.sectionGap}>
          {currentResults.length === 0 ? (
            <p className={styles.muted}>검색 결과가 없습니다.</p>
          ) : (
            <div className={styles.cardGrid}>
              {currentResults.map((dog) => (
                <div key={dog.id} className={styles.card}>
                  <img
                    className={styles.cardImg}
                    src={dog.imagePath || '/default-dog.jpg'}
                    alt="dog"
                  />
                  <h3 className={styles.cardTitle}>
                    {dog.species} {dog.gender}
                  </h3>
                  <p className={styles.cardDesc}>
                    {dog.shelterId} <br /> {dog.state}
                  </p>
                  <button
                    className={styles.cardBtn}
                    onClick={() => {
                      navigate(`/lookup/${dog.id}`, { state: { from: '/lookup' } });
                      sessionStorage.setItem(
                        'lookupSearchState',
                        JSON.stringify({
                          breed,
                          selectedDistrict,
                          keyword,
                          results,
                          currentPage,
                        })
                      );
                      if (imagePreview)
                        sessionStorage.setItem('lookupImagePreview', imagePreview);
                      sessionStorage.setItem('visitedByBack', 'true');
                    }}
                  >
                    상세보기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
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
                  onClick={() => setCurrentPage(pageNum)}
                  className={classNames(styles.pageBtn, {
                    [styles.pageBtnActive]: currentPage === pageNum,
                  })}
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
    </div>
  );
}