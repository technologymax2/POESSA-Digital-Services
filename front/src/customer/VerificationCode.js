import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function VerificationCode() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const faydaNumber = location.state?.faydaNumber;

  const handleVerify = async () => {
    setStatus('በማረጋገጥ ላይ...');
    try {
      // እዚህ ጋር የራስህን Backend API አገናኝ
      const response = await fetch('https://poessa-digital-services-1.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faydaNumber, code }),
      });
      const result = await response.json();

      if (result.success) {
        navigate('/liveness-test', { state: { faydaNumber } });
      } else {
        setStatus('❌ የተሳሳተ ኮድ! እባክዎ እንደገና ይሞክሩ።');
      }
    } catch (err) {
      setStatus('❌ የሰርቨር ስህተት፣ እንደገና ይሞክሩ።');
    }
  };

  return (
    <div className="otp-container">
      <h3>የማረጋገጫ ኮድ (OTP)</h3>
      <p>ወደ ስልክዎ የተላከውን 6 ዲጂት ኮድ ያስገቡ።</p>
      <input type="text" maxLength="6" value={code} onChange={(e) => setCode(e.target.value)} />
      <button onClick={handleVerify}>አረጋግጥ</button>
      <p>{status}</p>
    </div>
  );
}
export default VerificationCode;
