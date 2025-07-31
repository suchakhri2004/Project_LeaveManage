"use client";
import React, { useState, useRef } from 'react';
import styles from './forgot.module.scss';
import { PiUserCircleThin } from "react-icons/pi";

const ForgotPasswordPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [error2, setError2] = useState('');
  const [success2, setSuccess2] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpRefs = useRef<HTMLInputElement[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasteData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const lastFilledIndex = Math.min(pasteData.length, 5);
    otpRefs.current[lastFilledIndex]?.focus();
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const startOtpCooldown = () => {
    setOtpCooldown(60);
    const interval = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpRequest = async () => {
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:9898/api/auth/forgot_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการขอ OTP');
      }

      setOtpVerified(false);
      startOtpCooldown();
      setSuccess2('ส่ง otp เรียบร้อย กรุณากรอกภายใน 60 วินาที บางครั้งอาจอยู่ในไฟล์ขยะ หรือ spam โปรดเช็คดูให้เรียบร้อย');
    } catch (error: any) {
      setError(error.message || 'ไม่สามารถขอ OTP ได้');
      setSuccess2('');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError2('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setError2('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:9898/api/auth/verifyOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการตรวจสอบ OTP');
      }

      localStorage.setItem('resetToken', data.token);
      setOtpVerified(true);
      window.location.href = '/newpassword';
    } catch (error: any) {
      setError2(error.message || 'ไม่สามารถยืนยัน OTP ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <img
            src="/logo.svg"
            alt="Government Logo"
            className={styles.logo}
            loading="lazy"
          />
        </div>

        <form className={styles.loginForm} onSubmit={handleOtpSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">กรุณากรอกอีเมล</label>
            <div className={styles.inputWrap}>
              <div className={styles.leftGroup}>
                <PiUserCircleThin className={styles.icon} />
                <input
                  id="username"
                  type="email"
                  placeholder="กรุณากรอกอีเมลสำหรับรับรหัส OTP"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  aria-label="อีเมล"
                />
              </div>
              <button 
                type="button" 
                className={styles.otpButton} 
                onClick={handleOtpRequest} 
                disabled={loading || otpCooldown > 0}
              >
                {loading
                  ? 'กำลังขอ OTP...'
                  : otpCooldown > 0
                    ? `ขอใหม่ได้ใน ${otpCooldown} วินาที`
                    : 'รับรหัส OTP'}
              </button>
            </div>
            <div className={styles.underline}></div>

            {success2 ? (
              <div style={{ color: 'green', marginTop: '8px' }} className={styles['success-message']}>
                {success2}
              </div>
            ) : error ? (
              <div style={{ color: 'red' }} className={styles['error-message']}>
                {error}
              </div>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label>รหัส OTP</label>
            <div className={styles.otpContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if(el) otpRefs.current[index] = el;
                  }}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={styles.otpInput}
                  aria-label={`OTP digit ${index + 1}`}
                  inputMode="numeric"
                  pattern="\d*"
                />
              ))}
            </div>
          </div>

          {error2 && (
            <div style={{ color: 'red' }} className={styles['error-message']}>{error2}</div>
          )}

          <div className={styles.button}>
            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading || otpVerified}
            >
              {loading
                ? 'กำลังยืนยัน OTP...'
                : otpVerified
                  ? 'OTP ยืนยันแล้ว'
                  : 'ยืนยัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
