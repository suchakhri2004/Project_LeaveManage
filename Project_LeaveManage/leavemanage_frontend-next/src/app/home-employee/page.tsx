'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar/Navbar';
import styles from './home-employee.module.scss'; 
import LeaveChart from '../../components/leavechart/leavechart';
import { useRouter } from 'next/navigation';

function Page() {
  const router = useRouter();
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [profileData, setProfileData] = useState({
    firstName: 'Loading...',
    lastName: 'Loading...',
    email: 'Loading...',
    position: 'Loading...',
    affiliation: 'Loading...'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchData = async () => {
      try {
        const leaveRes = await fetch('http://localhost:9898/api/dashboard/leaveBalance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!leaveRes.ok) {
          setLeaveBalances([]);
        } else {
          const leaveJson = await leaveRes.json();
          setLeaveBalances(leaveJson);
        }

        const profileRes = await fetch('http://localhost:9898/api/dashboard/getProfile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileRes.ok) {
          setProfileData({
            firstName: 'N/A',
            lastName: 'N/A',
            email: 'N/A',
            position: 'N/A',
            affiliation: 'N/A'
          });
        } else {
          const json = await profileRes.json();
          const profileJson = json[0];

          setProfileData({
            firstName: profileJson.firstname,
            lastName: profileJson.lastname,
            email: profileJson.email,
            position: profileJson.positionname,
            affiliation: profileJson.affiliation_name
          });
        }
      } catch (err) {
        setProfileData({
          firstName: 'N/A',
          lastName: 'N/A',
          email: 'N/A',
          position: 'N/A',
          affiliation: 'N/A'
        });
      }
    };

    fetchData();
  }, []);

  const getRemainingDays = (leaveName) => {
    const leaveType = leaveBalances.find((item) => item.name === leaveName);
    if (leaveType) {
      const total = parseInt(leaveType.total_days);
      const used = parseInt(leaveType.used_days);
      return `${total - used} วัน`;
    }
    return 'N/A';
  };

  return (
    <div className={styles['home-employee-page']}>
      <Navbar />
      <div className={styles.container}>

        <div className={styles.body}>
          <div className={styles.wrap}>
            <div className={styles.box1}>
              <img src="/profiletest.png" alt="Test Image" />
            </div>
            <div className={styles.box2}>
              <div className={styles.greenbox}>
                <img src="/callcenter.png" alt="Test Image" />
                <p>แจ้งลา</p>
                <button onClick={() => router.push('/request-leave')}>คลิก</button>
              </div>
              <div className={styles.yellowbox}>
                <img src="/document.png" alt="Test Image" />
                <p>ติดตามสถานะการลาล่าสุด</p>
                <button onClick={() => router.push('/history')}>คลิก</button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.wrap}>
            <div className={styles.box1}>
              <p>สถิติการลาของท่าน (รายปี)</p>
              <div className={styles.chart}>
                <LeaveChart />
              </div>
            </div>

            <div className={styles.box2}>
              <p>สิทธิการลาคงเหลือ</p>
              <div className={styles.totaldays}>
                <div className={`${styles.grid} ${styles.grid1}`}><p>ลาป่วย</p><span>{getRemainingDays('ลาป่วย')}</span></div>
                <div className={`${styles.grid} ${styles.grid2}`}><p>ลากิจ</p><span>{getRemainingDays('ลากิจส่วนตัว')}</span></div>
                <div className={`${styles.grid} ${styles.grid3}`}><p>ลาพักร้อน</p><span>{getRemainingDays('ลาพักผ่อน')}</span></div>
              </div>
            </div>

            <div className={styles.box3}>
              <div className={styles.data}>
                <div className={styles.row}><h4>ชื่อ</h4><p>{profileData.firstName}</p></div>
                <div className={styles.row}><h4>นามสกุล</h4><p>{profileData.lastName}</p></div>
                <div className={styles.row}><h4>อีเมล</h4><p>{profileData.email}</p></div>
                <div className={styles.row}><h4>ตำแหน่ง</h4><p>{profileData.position}</p></div>
                <div className={styles.row}><h4>สังกัด</h4><p>{profileData.affiliation}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
