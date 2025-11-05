import React from 'react';
import { Link } from 'react-router-dom';

export default function MyPageTabs({ activeTab, lostPets, inquiries }) {
  const renderContent = () => {
    switch (activeTab) {
      case 'report':
        if (lostPets.length === 0) {
          return <p>작성한 분실신고 글이 없습니다.</p>;
        }
        return (
          <div>
            <h3>내 분실신고 글</h3>
            <ul className="mypage-list">
              {lostPets.map((item) => (
                <li key={item.id}>
                  <Link to={`/report/view?id=${item.id}`}>
                    <strong>{item.dogName ?? '강아지 이름 정보없음'}</strong>
                    <div className="meta">
                      작성일: {item.createdAt.split('T')[0]}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'inquiries':
        if (inquiries.length === 0) {
          return <p>작성한 문의글이 없습니다.</p>;
        }
        return (
          <div>
            <h3>문의한 내용</h3>
            <ul className="mypage-list">
              {inquiries.map((item) => (
                <li key={item.id}>
                  <Link to={`/inquiry/detail?id=${item.id}&from=mypage`}>
                    <strong>{item.title}</strong>
                    <div className="meta">
                      작성일: {item.createdAt.split('T')[0]}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return <p>내용이 없습니다.</p>;
    }
  };

  return (
    <div className="tab-content">
      {renderContent()}
    </div>
  );
}