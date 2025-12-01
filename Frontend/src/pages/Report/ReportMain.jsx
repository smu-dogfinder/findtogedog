import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import { regionData } from '@/utils/regionData';
import classNames from 'classnames'; // classnames 라이브러리 임포트
import styles from '@/styles/pages/pages.module.css'; // .module.css 파일 임포트

export default function ReportList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryPage = Number(searchParams.get('page')) || 1;
  const queryLimit = Number(searchParams.get('size')) || 5;
  const queryOrder = searchParams.get('order') || 'asc';
  const queryRegion = searchParams.get('region') || '';
  const queryDistrict = searchParams.get('district') || '';
  const querySpecies = searchParams.get('species') || '';
  const queryKeyword = searchParams.get('keyword') || '';

  const [meta, setMeta] = useState({ totalPages: 1, currentPage: 1, totalItems: 0 });
  const [results, setResults] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(queryRegion);
  const [selectedDistrict, setSelectedDistrict] = useState(queryDistrict);
  const [keyword, setKeyword] = useState(queryKeyword);

  const currentPage = meta.currentPage;
  const totalPages = meta.totalPages;

  const maxVisible = 10;
  let startPage = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(endPage - maxVisible + 1, 1);
  }
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const createPageLink = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    params.set('size', queryLimit);
    return `/report?${params.toString()}`;
  };

  const handleClick = (id) => navigate(`/report/view?id=${id}&from=${queryPage}`);

  useEffect(() => {
    const fetchMissingDogs = async () => {
      try {
        const params = new URLSearchParams();
        if (queryRegion) params.append('region', queryRegion);
        if (queryDistrict) params.append('district', queryDistrict);
        if (queryKeyword) params.append('keyword', queryKeyword);
        if (querySpecies) params.append('species', querySpecies);
        params.append('page', queryPage - 1);
        params.append('size', queryLimit);
        params.append('order', queryOrder);

        const res = await axios.get(`/api/lost-pet/paged?${params.toString()}`, {
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        });

        console.log(res.data);
        const dataList = res.data?.data ?? [];
        const metaData = res.data?.pagination?.meta ?? res.data?.meta ?? { totalPages: 1, currentPage: 1, totalItems: dataList.length };
        setResults(dataList);
        setMeta({
          ...metaData,
          totalPages: Math.max(1, Number(metaData.totalPages ?? 1)),
          currentPage: Math.max(1, Number(metaData.currentPage ?? 1)),
        });
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      }
    };
    fetchMissingDogs();
  }, [queryPage, queryLimit, queryOrder, queryRegion, queryDistrict, querySpecies, queryKeyword]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedRegion) params.append('region', selectedRegion);
    if (selectedDistrict) params.append('district', selectedDistrict);
    if (keyword) params.append('keyword', keyword);
    if (querySpecies) params.append('species', querySpecies);
    params.append('page', 1);
    params.append('size', queryLimit);

    navigate(`/report?${params.toString()}`, { state: { previousQuery: searchParams.toString() } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className={styles.bannerWrap}><Banner text="유기견 신고 전체보기" /></div>
      <Breadcrumb />

      <div className={styles.pageWrap}>
        <h2 className={styles.pageTitle}>신고된 유기견 검색</h2>

        <div className={classNames(styles.rowSpread)} style={{ marginTop: '2.5rem', marginBottom: '1.5rem' }}>
          <div>전체 <strong className={styles.countBadge}>{meta?.totalItems ?? results.length}</strong> 건</div>
          <button className={classNames(styles.btn, styles.btnPrimary)} onClick={() => navigate('/report/write')}>신고글 작성하기</button>
        </div>

        <div className={styles.row} style={{ marginBottom: '1.5rem' }}>
          <select className={styles.select} value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDistrict(''); }}>
            <option value="">행정구역 선택</option>
            {Object.keys(regionData).map((region) => (<option key={region} value={region}>{region}</option>))}
          </select>

          <select className={styles.select} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedRegion || regionData[selectedRegion].length === 0}>
            <option value="">시/군/구 선택</option>
            {regionData[selectedRegion]?.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>

          <input className={styles.input} type="text" placeholder="검색어 입력" value={keyword} onChange={(e) => setKeyword(e.target.value)} />

          <button className={classNames(styles.btn, styles.btnPrimary, styles.btnAnimated)} onClick={handleSearch}>검색</button>
        </div>
      </div>

      <div className={styles.pageWrap} style={{ paddingTop: 0 }}>
        <div className={styles.cardGrid}>
          {results?.length === 0 ? (
            <div className={styles.muted}>
              등록된 유기견 신고가 없습니다.
            </div>
          ) : (
            results?.map((dog, i) => (
              <div
                key={dog.id}
                className={styles.card}
                onClick={() => handleClick(dog.id)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  className={styles.cardImg}
                  src={dog.imagePath ? `/api/lost-pet/images${dog.imagePath}` : '/imageupload/Nophoto.png'}
                  alt="유기견 이미지"
                  onError={(e) => { e.currentTarget.src = '/imageupload/Noimage.png'; }}
                />
                <h3 className={styles.cardTitle}>{dog.dogName || '이름 없는 반려견'}</h3>
                <div>
                  <p><strong>실종일:</strong> {dog.dateLost ? new Date(dog.dateLost).toLocaleDateString('ko-KR') : '정보없음'}</p>
                  <p><strong>실종 장소:</strong> {dog.placeLost}</p>
                  <p><strong>종:</strong> {dog.species} / <strong>성별:</strong> {dog.gender}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.pagination}>
        <button className={styles.pageBtn} onClick={() => navigate(createPageLink(1))} disabled={queryPage === 1}>처음</button>
        <button className={styles.pageBtn} onClick={() => navigate(createPageLink(Math.max(queryPage - 1, 1)))} disabled={queryPage === 1}>이전</button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            className={classNames(styles.pageBtn, { [styles.pageBtnActive]: queryPage === page })}
            onClick={() => navigate(createPageLink(page))}
          >
            {page}
          </button>
        ))}

        <button className={styles.pageBtn} onClick={() => navigate(createPageLink(Math.min(queryPage + 1, totalPages)))} disabled={queryPage === totalPages}>다음</button>
        <button className={styles.pageBtn} onClick={() => navigate(createPageLink(totalPages))} disabled={queryPage === totalPages}>끝</button>
      </div>
    </div>
  );
}