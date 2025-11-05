import React from 'react';

export default function Banner({ text, fontSize='3rem' }) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        src="/imageupload/banner_3.png"
        alt="Banner"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'black',
          fontSize: fontSize,
          fontWeight: 'bold',
          fontFamily: 'Do Hyeon',
          textShadow: '1px 1px 2px white',
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  );
}
