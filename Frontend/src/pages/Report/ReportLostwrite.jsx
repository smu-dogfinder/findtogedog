import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Banner from '@/components/Mainpage/Banner';
import Breadcrumb from '@/components/Breadcrumb';
import { LoginContext } from '@/contexts/LoginContext';
import { regionData } from '../../utils/regionData';
import classNames from 'classnames';
import styles from '@/styles/pages/write-forms.module.css';

export default function LostReport() {
  const navigate = useNavigate();
  const { user } = useContext(LoginContext);

  const meNickname = user?.nickName ?? null;
  const meUserid = user?.userid ?? user?.id ?? null;

  const [form, setForm] = useState({
    dateLost: '',
    regionLost: '',
    districtLost: '',
    species: '',
    gender: '',
    content: '',
    phone: '',
    dogName: '',
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'regionLost') {
      setForm((prev) => ({ ...prev, [name]: value, districtLost: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert('이미지 파일만 업로드 가능합니다.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!user || !meNickname) {
      alert('분실 신고를 작성하려면 로그인해야 합니다.');
      navigate('/login');
      return;
    }

    if (!form.dateLost || !form.regionLost || !form.districtLost || !form.phone.trim()) {
      alert('분실 날짜, 분실 장소, 연락처를 모두 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const placeLost = `${form.regionLost} ${form.districtLost}`;

      const formData = new FormData();
      formData.append('dateLost', form.dateLost);
      formData.append('placeLost', placeLost);
      formData.append('species', form.species ?? '');
      formData.append('gender', form.gender ?? '');
      formData.append('content', form.content ?? '');
      formData.append('phone', form.phone ?? '');
      formData.append('dogName', form.dogName ?? '');
      if (image) formData.append('image', image);

      console.log([...formData.entries()]);

      const res = await axios.post('/api/lost-pet', formData, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error(`등록 실패 (status: ${res.status})`);
      }

      alert('분실 신고가 등록되었습니다.');
      navigate('/report');
    } catch (error) {
      console.error('신고 등록 중 오류:', error);
      if (error?.response?.status === 401) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else {
        alert('신고 등록에 실패했습니다. 입력 정보를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.writePage}>
      <div>
        <Banner text="반려동물 분실 신고" />
        <Breadcrumb />
      </div>

      <div className={styles.pagePadding}>
        <form onSubmit={handleSubmit} className={styles.writeForm}>
          <div>
            <label className={styles.formLabel}>작성자</label>
            <input
              type="text"
              className={classNames(styles.writeInput, styles.inputDimmed)}
              placeholder={meNickname}
              value={meNickname || ''}
              readOnly
              title="로그인 정보로 자동 입력됩니다."
            />
          </div>

          <div>
            <label className={styles.formLabel}>분실 날짜</label>
            <input
              type="date"
              name="dateLost"
              className={styles.writeInput}
              value={form.dateLost}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={styles.formLabel}>분실 장소</label>
            <div className={styles.writeRow}>
              <select
                name="regionLost"
                className={classNames(styles.writeSelect, styles.col)}
                value={form.regionLost}
                onChange={handleChange}
                required
              >
                <option value="">행정구역 선택</option>
                {Object.keys(regionData).map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <select
                name="districtLost"
                className={classNames(styles.writeSelect, styles.col)}
                value={form.districtLost}
                onChange={handleChange}
                required
                disabled={!form.regionLost}
              >
                <option value="">시/군/구 선택</option>
                {regionData[form.regionLost]?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.formLabel}>품종</label>
              <input
                name="species"
                className={styles.writeInput}
                value={form.species}
                onChange={handleChange}
                placeholder="예: 말티즈"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.formLabel}>성별</label>
              <select name="gender" className={styles.writeSelect} value={form.gender} onChange={handleChange}>
                <option value="">선택</option>
                <option value="암컷">암컷</option>
                <option value="수컷">수컷</option>
              </select>
            </div>
          </div>

          <div>
            <label className={styles.formLabel}>특징</label>
            <textarea
              name="content"
              className={classNames(styles.writeTextarea, styles.textareaSmall)}
              value={form.content}
              onChange={handleChange}
              placeholder="특징을 자유롭게 입력해주세요 (예: 나이, 초록색 목줄, 왼쪽 귀가 접혀 있음 등)"
            />
          </div>

          <div>
            <label className={styles.formLabel}>연락처</label>
            <input
              name="phone"
              className={styles.writeInput}
              value={form.phone}
              onChange={handleChange}
              placeholder="예: 010-1234-5678"
              required
            />
          </div>

          <div>
            <label className={styles.formLabel}>반려견 이름(선택)</label>
            <input
              name="dogName"
              className={styles.writeInput}
              value={form.dogName}
              onChange={handleChange}
              placeholder="예: 댕댕이"
            />
          </div>

          <div>
            <label className={styles.formLabel}>사진 업로드</label>
            <div
              className={styles.dropzone}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('fileInput').click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="미리보기" />
              ) : (
                <p>이미지를 드래그하거나 클릭해서 업로드하세요</p>
              )}
              <input
                type="file"
                accept="image/*"
                id="fileInput"
                className={styles.inputFileHidden}
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className={styles.actionsRight}>
            <button
              type="submit"
              className={classNames(styles.writeBtn, styles.btnPrimary, {
                [styles.btnIsLoading]: loading
              })}
              disabled={!meNickname || loading}
            >
              {loading ? '등록 중...' : '신고 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}