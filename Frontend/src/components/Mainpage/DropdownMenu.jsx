import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/DropdownMenu.css';

export default function DropdownMenu({ label, sections }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="nav-item"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="nav-label">{label}</span>

      {isOpen && (
        <div className="mega-dropdown">
          {sections.map((section, idx) => (
            <div className="dropdown-column" key={idx}>
              <h4>{section.title}</h4>
              {section.items.map((item, i) => (
                <Link key={i} to={item.path}>{item.label}</Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
