import React from 'react';
import '../../styles/AdminPage.css';

export default function AdminTabBar({ activeTab, onChange, tabs }) {
  return (
    <div className="mypage-tabs">
      <div className="tab">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={activeTab === t.key ? 'active' : ''}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
