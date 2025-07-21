"use client";
import React, { useState } from 'react';
import styles from './login.module.scss';
import { PiUserCircleThin, PiLockThin } from "react-icons/pi";
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';



const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const validateInput = () => {
    const { username, password } = formData;
    // if (!/^\d{13}$/.test(username)) {
    //   return "กรุณากรอกหมายเลขบัตรประชาชนให้ครบ 13 หลัก";
    // }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:9898/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'ไม่สามารถเข้าสู่ระบบได้');
        } catch {
          throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);

      const decoded: any = jwtDecode(data.token);
      const position = decoded.position;

      if (
        position === 'นักทรัพยากรบุคคลชำนาญการ' ||
        position === 'ผู้บังคับบัญชา' ||
        position === 'รองปลัดเทศบาล1' ||
        position === 'รองปลัดเทศบาล2'
      ) {
        router.push('/home-approve');
      } else if (position === 'ปลัดเทศบาล') {
        router.push('/home-mayor');
      } else if (position === 'SuperAdmin'){
        router.push('/superadmin-dashboard');
      } else {
        router.push('/home-employee');
      }

    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดขณะเข้าสู่ระบบ');
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
            alt="โลโก้หน่วยงาน"
            className={styles.logo}
            loading="lazy"
          />
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="username">ชื่อผู้ใช้</label>
            <PiUserCircleThin className={styles.icon} />
            <input
              id="username"
              type="text"
              placeholder="กรอกหมายเลขบัตรประชาชน"
              required
              aria-label="ชื่อผู้ใช้"
              value={formData.username}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={13}
            />
            <div className={styles.underline}></div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">รหัสผ่าน</label>
            <PiLockThin className={styles.icon} />
            <input
              id="password"
              type="password"
              placeholder="กรอกรหัสผ่านของท่าน"
              required
              aria-label="รหัสผ่าน"
              value={formData.password}
              onChange={handleChange}
            />
            <div className={styles.underline}></div>

            <div className={styles.forgotPasswordContainer}>
              <a href="/forgot" className={styles.forgotPassword}>ลืมรหัสผ่าน</a>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage} style={{ color: 'red', marginTop: '10px' }}>
              {error}
            </div>
          )}

          <div className={styles.button}>
            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
