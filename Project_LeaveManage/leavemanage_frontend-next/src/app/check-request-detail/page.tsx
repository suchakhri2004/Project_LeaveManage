'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar/Navbar';
import styles from './leaveRequestDetail.module.scss';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import DataRequest from '../../components/check-request-detail/DataRequest';

interface Profile {
  firstname: string;
  lastname: string;
  positionname: string;
}

interface LeaveBalanceItem {
  total_days: string;
  used_days: string;
  name: string;
}

interface ReplacementItem {
  id: string;
  name: string;
}

interface LeaveTypeItem {
  id: string;
  name: string;
}

function Page() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [replacementList, setReplacementList] = useState<ReplacementItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contact, setContact] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
    const searchParams = useSearchParams();
  const employee_id = searchParams.get('employee_id');
  const replacementOptions = replacementList.map(rep => ({
    value: rep.id,
    label: rep.name
  }));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:9898/api/dashboard/getProfileById/${employee_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data[0]);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchLeaveBalance = async () => {
      try {
        const res = await fetch(`http://localhost:9898/api/dashboard/leaveBalanceById/${employee_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load leave balance');
        const data = await res.json();
        setLeaveBalances(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchLeaveBalance();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const body = {
      subject: 'ขอลางานนะจ๊ะ',
      leavetype_id: leaveTypeId,
      reason,
      proof_image_url: null,
      datefrom: startDate,
      dateto: endDate,
      contact,
      responsible_person_id: responsibleId,
    };
  };

  return (
    <div className={styles['request-leave-page']}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.boxleft}>
          <div className={styles['profile-box']}>
            <img src="/profiletest.png" alt="Profile Image" className={styles['profile-image']} />
          </div>

          <div className={styles['leave-summary']}>
            <div className={styles['summary-header']}>
              <h4>จำนวนวันลาที่ใช้และคงเหลือของ</h4>
              <h4>
                : {profile?.firstname} {profile?.lastname} ({profile?.positionname})
              </h4>
            </div>
            <div className={styles['summary-body']}>
              {leaveBalances.length === 0 ? (
                <p>กำลังโหลดข้อมูลวันลา...</p>
              ) : (
                leaveBalances.map((item, idx) => {
                  const remaining = Number(item.total_days) - Number(item.used_days);
                  return (
                    <div className={styles['summary-item']} key={idx}>
                      <span>{item.name}</span>
                      <div className={styles['summary-values']}>
                        <p>ใช้ไปแล้ว: {item.used_days} วัน</p>
                        <p>คงเหลือ: {remaining} วัน</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className={styles.boxright}>
          <form className={styles['leave-form']} onSubmit={handleSubmit}>
            <div className={styles['form-group']}>
              <DataRequest/>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Page;

