// src/components/Navbar.jsx
import React, {useContext} from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Navbar.css';
import { LoginContext } from '@/contexts/LoginContext';

export default function Navbar() {
  const { user } = useContext(LoginContext);
  const isAdmin = !!(user?.role && String(user.role).toUpperCase().includes('ADMIN'));

  return (
    <ul className="menu">
      <li>
        <span style={{ textDecoration: 'none'}}>
          <Link to="/lookup" >유기견 조회</Link>
        </span>
        <ul className="submenu">
          <li><Link to="/lookup" style={{ textDecoration: 'none'}}>전체 보기</Link></li>
          <li><Link to="/lookup/predict-dog" style={{ textDecoration: 'none'}}>강아지의 성견 모습 예측</Link></li>
        </ul>
      </li>

      <li>
        <span style={{ textDecoration: 'none'}}>
          <Link to="/report" >유기견 신고</Link>
        </span>
        <ul className="submenu">
          <li><Link to="/report" style={{ textDecoration: 'none'}}>전체 보기</Link></li>
          <li><Link to="/report/how" style={{ textDecoration: 'none'}}>유기견 신고 방법 안내</Link></li>
        </ul>
      </li>

      <li>
        <span style={{ textDecoration: 'none'}}>
          <Link to="/adopt" >유기견 입양</Link>
        </span>
        <ul className="submenu">
          <li><Link to="/adopt" style={{ textDecoration: 'none'}}>전체 보기</Link></li>
          <li><Link to="/adopt/process" style={{ textDecoration: 'none'}}>입양 절차 안내</Link></li>
        </ul>
      </li>

      <li><Link to="/shelters" style={{ textDecoration: 'none'}}>보호소 찾기</Link></li>
      
      <li>
        <span style={{ textDecoration: 'none'}}>공지 및 문의</span>
        <ul className="submenu">
          <li><Link to="/notice" style={{ textDecoration: 'none'}}>공지사항</Link></li>
          <li><Link to="/inquiry" style={{ textDecoration: 'none'}}>문의사항</Link></li>
        </ul>
      </li>

      <li>
        <Link to={isAdmin ? "/adminpage" : "/mypage"} style={{ textDecoration: 'none' }}>마이페이지</Link>
      </li>
    </ul>
  );
}
