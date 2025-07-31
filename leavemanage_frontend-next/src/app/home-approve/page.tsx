
'use client';
import React from 'react';
import styles from './home-approve.module.scss';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar/Navbar';

const Dashboard = () => {
  const router = useRouter();

  return (
    <div className={styles['home-employee-page']}>
      <Navbar />
    <div className={styles['dashboard-container']}>
      <div className={`${styles.card} ${styles['card-1']}`}>
        <div className={styles['icon-container']}>
          <div className={styles['clipboard-icon']}></div>
        </div>
        <div className={styles['card-title']}>ตรวจสอบคำร้อง</div>
        <button className={styles['card-button']} onClick={() => router.push('/check-request')}>คลิก</button>
      </div>

      <div className={`${styles.card} ${styles['card-2']}`}>
        <div className={styles['icon-container']}>
          <div className={styles['chart-icon']}>
            <div className={styles['chart-arrow']}></div>
          </div>
        </div>
        <div className={styles['card-title']}>สถิติการลา</div>
        <button className={styles['card-button']} onClick={() => router.push('/data-dashboard')}>คลิก</button>
      </div>

      <div className={`${styles.card} ${styles['card-3']}`}>
        <div className={styles['icon-container']}>
            <img src="/callcenter.png" alt="แจ้งลา" style={{ width: '70px', height: '70px' }} />
        </div>

        <div className={styles['card-title']}>แจ้งลา</div>
        <button className={styles['card-button']} onClick={() => router.push('/request-leave')}>คลิก</button>
      </div>

      <div className={`${styles.card} ${styles['card-4']}`}>
        <div className={styles['icon-container']}>
            <img src="/document.png" alt="ติดตามสถานะ" style={{ width: '60px', height: '70px' }} />
        </div>

        <div className={styles['card-title']}>
          ติดตามสถานะ<br />การลาล่าสุด
        </div>
        <button className={styles['card-button']} onClick={() => router.push('/history')}>คลิก</button>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;