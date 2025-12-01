import React, {useContext} from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { LoginContext } from '@/contexts/LoginContext';
import styles from '@/styles/pages/detail.module.css';
import classNames from 'classnames';

export default function NoticeDeleteButton({ noticeId, afterDelete }) {
  const { user } = useContext(LoginContext);
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));

  const handleDelete = async () => {
    if (!window.confirm('해당 공지사항을 삭제하시겠습니까?')) return;

    const token = Cookies.get('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await axios.delete(`/api/notices/${noticeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      // 204(No Content) 정상 처리
      if (res.status === 204 || res.status === 200) {
        alert('삭제되었습니다.');
        afterDelete?.();
      } else {
        alert('삭제 처리되었습니다.');
        afterDelete?.();
      }
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 403 ? '공지사항 삭제 권한이 없습니다.' : '삭제 실패');
      alert(msg);
    }
  };

  return (
    <div>
      {isAdmin && (
        <button onClick={handleDelete} className={classNames(styles.btn, styles.btnDanger)}>
          삭제
        </button>
      )}
    </div>
  );
}
