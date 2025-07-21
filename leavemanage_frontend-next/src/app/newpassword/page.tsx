"use client";

import React, { useState } from 'react';
import styles from './newpassword.module.scss';
import { PiCheckSquareThin, PiLockThin } from "react-icons/pi";
import { useRouter } from 'next/navigation';
const Page = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    const token = localStorage.getItem("resetToken");
    if (!token) {
      setError("ไม่พบ token หรือ token หมดอายุ");
      console.log(token)
      return;
    }

    try {
      const response = await fetch("http://localhost:9898/api/auth/resetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
        return;
      }

      localStorage.removeItem("resetToken");

      router.push('/login')

    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดที่ระบบ");
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

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="password">รหัสผ่านใหม่</label>
            <PiLockThin className={styles.icon} />
            <input
              id="password"
              type="password"
              placeholder="กรอกรหัสผ่านใหม่ของท่าน"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className={styles.underline}></div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
            <PiCheckSquareThin className={styles.icon} />
            <input
              id="confirmPassword"
              type="password"
              placeholder="กรอกรหัสผ่านใหม่ของท่านอีกครั้ง"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className={styles.underline}></div>
          </div>

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          <div className={styles.button}>
            <button type="submit" className={styles.loginButton}>
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
