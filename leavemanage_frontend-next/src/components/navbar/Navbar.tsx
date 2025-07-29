'use client';
import React, { useState, useEffect } from 'react';
import styles from './navbar.module.scss';
import { GiHamburgerMenu } from "react-icons/gi";
import { CgProfile } from "react-icons/cg";
import { jwtDecode } from 'jwt-decode';
import User from '../../app/types/interfaceuser';
import { useRouter } from 'next/navigation';

function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [role, setRole] = useState('');
  const [position, setPosition] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login')
      return;
    }

    const decodeToken = (token) => {
      if (!token) return null;

      try {
        const decoded = jwtDecode<User>(token);
        return decoded;
      } catch (error) {
        console.error('Token is invalid', error);
        return null;
      }
    };

    const userData = decodeToken(token);

    if (userData) {
      setRole(userData.role);
      setPosition(userData.position);
    } else {
      router.push('/login');
    }
  }, [router]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsMenuOpen(false); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const renderMenuForRole = () => {
    if (role === 'EMPLOYEE') {
      return (
        <>
        <p onClick={() => router.push('/home-employee')}>หน้าหลัก</p>
        <p onClick={() => router.push('/history')}>ประวัติการลา</p>
        </>
      );
    } else if (role === 'APPROVE'){
      if (position === 'นักทรัพยากรบุคคลชำนาญการ' || position === 'ผู้บังคับบัญชา' || position === 'รองปลัดเทศบาล') {
        return (
          <>
            <p onClick={() => router.push('/home-approve')}>หน้าหลัก</p>
            <p onClick={() => router.push('/check-request')}>ตรวจสอบคำร้อง</p>
            <p>สถิติการลา</p>
            <p onClick={() => router.push('/history')}>ประวัติการลา</p>
          </>
        );
      } else if (position === 'ปลัดเทศบาล') {
        return (
          <>
            <p onClick={() => router.push('/home-mayor')}>หน้าหลัก</p>
            <p onClick={() => router.push('/petition')}>ตรวจสอบคำร้อง</p>
            <p>สถิติการลา</p>
          </>
        );
      }
      return null;
    }
    return null;
  };

  return (
    <nav>
      <div className={styles['nav-container']}>
        <div className={styles.left}>
          <img src="/logo.svg" alt="logo" className={styles.logo}/>
          <p>ระบบบันทึกการลา</p>
        </div>

        {/* เมนูหลัก */}
        <div className={`${styles.right} ${isMenuOpen ? styles['mobile-show'] : ''}`}>
          {renderMenuForRole()}
          
          {/* ส่วนของโปรไฟล์เมนู - แสดงใน Desktop */}
          <div className={styles['profile-menu-desktop']}>
            <CgProfile 
              onClick={toggleProfile} 
              className={styles['profile-icon']}
            />
            {isProfileOpen && (
              <div className={styles['profile-dropdown']}>
                <p>เปลี่ยนรหัสผ่าน</p>
                <p onClick={handleLogout} style={{color:'red'}}>ออกจากระบบ</p>
              </div>
            )}
          </div>

          {/* ส่วนของเมนูโปรไฟล์ - แสดงใน Mobile */}
          <div className={styles['profile-menu-mobile']}>
            <p>เปลี่ยนรหัสผ่าน</p>
            <p style={{color:'red'}}>ออกจากระบบ</p>
          </div>
        </div>

        {/* ปุ่ม Hamburger - แสดงเฉพาะใน Mobile */}
        <GiHamburgerMenu 
          onClick={toggleMenu} 
          className={styles['hamburger-icon']}
        />
      </div>
    </nav>
  );
}

export default Navbar;
