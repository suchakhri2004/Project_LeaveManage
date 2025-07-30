'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './processDetail.module.scss';
import Navbar from '../../components/navbar/Navbar';
import { useSearchParams } from 'next/navigation';

interface LeaveStatus {
  status1: boolean | null;
  status1_update: string | null;
  status2: boolean | null;
  status2_update: string | null;
  status3: boolean | null;
  status3_update: string | null;
  status4: boolean | null;
  status4_update: string | null;
  status5: boolean | null;
  status5_update: string | null;
  responsible_firstname: string;
  responsible_lastname: string;
  hr_firstname: string;
  hr_lastname: string;
  supervisor_firstname: string;
  supervisor_lastname: string;
  deputymayor_firstname: string;
  deputymayor_lastname: string;
  mayor_firstname: string;
  mayor_lastname: string;
  mayor_note: string;
}

const ProcessDetail = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [leaveData, setLeaveData] = useState<LeaveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);

    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:9898/api/dashboard/leaveData/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            return;
          }
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setLeaveData(data[0]);
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543; 
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} เวลา ${hours}:${minutes}`;
  };

  const getStepStatus = (stepNumber: number) => {
    if (!leaveData) return false;
    
    switch (stepNumber) {
      case 1:
        return leaveData.status1 !== null;
      case 2:
        return leaveData.status2 !== null;
      case 3:
        return leaveData.status3 !== null;
      default:
        return false;
    }
  };

  const getStepIconClass = (stepNumber: number) => {
    if (!leaveData) return styles.stepPending;

    switch (stepNumber) {
      case 1:
        return leaveData.status1 == true && leaveData.status2 == null ? styles.stepInProgress : leaveData.status1 == true && leaveData.status2 == true || leaveData.status2 == false ? styles.stepCompleted : styles.stepInProgress ;
      case 2:
        return leaveData.status2 == null || leaveData.status2 == false ? styles.stepPending : leaveData.status4 !== null ? styles.stepCompleted : styles.stepInProgress;
      case 3:
        return leaveData.status4 == null || leaveData.status4 == false ? styles.stepPending : leaveData.status5 !== null ? styles.stepCompleted : styles.stepInProgress;
      default:
        return styles.stepPending;
    }
  };

  const getTaskIcon = (status: boolean | null, previousStatus: boolean | null) => {
    if (status === true) {
      return { className: styles.completedIcon, content: '✓' };
    } else if (status === false) {
      return { className: styles.rejectedIcon, content: '✗' };
    } else if (previousStatus === true) {
      return { className: styles.inProgressIcon, content: '⏳' };
    } else {
      return { className: styles.pendingIcon, content: '...' };
    }
  };

  const getStatusText = (step: number, status: boolean | null) => {
    switch (step) {
      case 1:
        return status === true ? 'ผ่านการอนุมัติ' : 
               status === false ? 'ไม่ผ่านการอนุมัติ' : 
               'รอดำเนินการ';
      case 2:
        return status === true ? 'ผ่านการตรวจสอบ' : 
               status === false ? 'ไม่ผ่านการตรวจสอบ' : 
               'รอดำเนินการ';
      case 3:
        return status === true ? 'ผู้บังคับบัญชาออกความเห็นเรียบร้อย' : 
               status === false ? 'ผู้บังคับบัญชาไม่อนุมัติ' : 
               'รอดำเนินการ';
      case 4:
        return status === true ? 'รองปลัดเทศบาลออกความเห็นเรียบร้อย' : 
               status === false ? 'รองปลัดเทศบาลไม่อนุมัติ' : 
               'รอดำเนินการ';
      case 5:
        return status === true ? 'ปลัดเทศบาลอนุมัติ' : 
               status === false ? 'ปลัดเทศบาลไม่อนุมัติ' : 
               'รอดำเนินการ';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles['processDetail-page']}>
        <Navbar />
        <div className={styles.loadingContainer}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['processDetail-page']}>
        <Navbar />
        <div className={styles.errorContainer}>
          เกิดข้อผิดพลาด: {error}
        </div>
      </div>
    );
  }

  if (!leaveData) {
    return (
      <div className={styles['processDetail-page']}>
        <Navbar />
        <div className={styles.errorContainer}>ไม่พบข้อมูลการลา</div>
      </div>
    );
  }

  return (
    <div className={styles['processDetail-page']}>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>รายละเอียดการลา</h1>
        {/* Step 1 */}
        <div className={styles.stepContainer}>
          <div className={styles.stepHeader}>
            <div className={`${styles.stepIcon} ${getStepIconClass(1)}`}></div>
            <div className={styles.stepTitle}>ขั้นตอนที่ 1</div>
            <div className={styles.stepBadge}>
              {leaveData.status1 == true && leaveData.status2 == null ? '1/2 กำลังดำเนินการ' : leaveData.status2 != null ? '2/2 ดำเนินการเสร็จสิ้น' : '0/2 กำลังดำเนินการ'}
            </div>
          </div>
          <div className={styles.stepContent}>
            <div className={`${styles.taskItem} ${leaveData.status1 === true ? styles.completed : 
                          leaveData.status1 === false ? styles.rejected : styles.pending}`}>
              <div className={`${styles.taskIcon} ${getTaskIcon(leaveData.status1, null).className}`}>
                {getTaskIcon(leaveData.status1, null).content}
              </div>
              <div className={styles.taskDetails}>
                <div className={styles.taskTitle}>ส่งคำร้องไปยังผู้ปฎิบัติงานแทน</div>
                <div className={styles.taskSubtitle}>
                  {leaveData.responsible_firstname} {leaveData.responsible_lastname}
                </div>
              </div>
              <div className={styles.taskStatus}>
                <div className={styles.taskStatusMain}>
                  {getStatusText(1, leaveData.status1)}
                </div>
                {leaveData.status1_update && (
                  <div>ดำเนินการเมื่อ {formatDate(leaveData.status1_update)}</div>
                )}
              </div>
            </div>
            <div className={`${styles.taskItem} ${leaveData.status2 === true ? styles.completed : 
                          leaveData.status2 === false ? styles.rejected : 
                          leaveData.status1 !== null ? styles.inProgress : styles.pending}`}>
              <div className={`${styles.taskIcon} ${getTaskIcon(leaveData.status2, leaveData.status1).className}`}>
                {getTaskIcon(leaveData.status2, leaveData.status1).content}
              </div>
              <div className={styles.taskDetails}>
                <div className={styles.taskTitle}>ส่งคำร้องไปยังนักทรัพยากรบุคคล</div>
                <div className={styles.taskSubtitle}>
                  {leaveData.hr_firstname} {leaveData.hr_lastname}
                </div>
              </div>
              <div className={styles.taskStatus}>
                <div className={styles.taskStatusMain}>
                  {getStatusText(2, leaveData.status2)}
                </div>
                {leaveData.status2_update && (
                  <div>ดำเนินการเมื่อ {formatDate(leaveData.status2_update)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className={styles.stepContainer}>
          <div className={styles.stepHeader}>
            <div className={`${styles.stepIcon} ${getStepIconClass(2)}`}></div>
            <div className={styles.stepTitle}>ขั้นตอนที่ 2</div>
            <div className={styles.stepBadge}>
              {leaveData.status4 == true ? '2/2 ดำเนินการเสร็จสิ้น' : leaveData.status3 == true ? '1/2 กำลังดำเนินการ' : leaveData.status2 == false ? '0/2 ไม่สามารถดำเนินการได้' : leaveData.status2 == null ? '0/2 รอการดำเนินการ' : '0/2 กำลังดำเนินการ'}
            </div>
          </div>
          <div className={styles.stepContent}>
            <div className={`${styles.taskItem} ${leaveData.status3 === true ? styles.completed : 
                          leaveData.status3 === false ? styles.rejected : 
                          leaveData.status2 !== null ? styles.inProgress : styles.pending}`}>
              <div className={`${styles.taskIcon} ${getTaskIcon(leaveData.status3, leaveData.status2).className}`}>
                {getTaskIcon(leaveData.status3, leaveData.status2).content}
              </div>
              <div className={styles.taskDetails}>
                <div className={styles.taskTitle}>ผู้บังคับบัญชาออกความเห็น</div>
                <div className={styles.taskSubtitle}>
                  {leaveData.supervisor_firstname} {leaveData.supervisor_lastname}
                </div>
              </div>
              <div className={styles.taskStatus}>
                <div className={styles.taskStatusMain}>
                  {getStatusText(3, leaveData.status3)}
                </div>
                {leaveData.status3_update && (
                  <div>ดำเนินการเมื่อ {formatDate(leaveData.status3_update)}</div>
                )}
              </div>
            </div>
            <div className={`${styles.taskItem} ${leaveData.status4 === true ? styles.completed : 
                          leaveData.status4 === false ? styles.rejected : 
                          leaveData.status3 !== null ? styles.inProgress : styles.pending}`}>
              <div className={`${styles.taskIcon} ${getTaskIcon(leaveData.status4, leaveData.status3).className}`}>
                {getTaskIcon(leaveData.status4, leaveData.status3).content}
              </div>
              <div className={styles.taskDetails}>
                <div className={styles.taskTitle}>รองปลัดเทศบาลออกความเห็น</div>
                <div className={styles.taskSubtitle}>
                  {leaveData.deputymayor_firstname} {leaveData.deputymayor_lastname}
                </div>
              </div>
              <div className={styles.taskStatus}>
                <div className={styles.taskStatusMain}>
                  {getStatusText(4, leaveData.status4)}
                </div>
                {leaveData.status4_update && (
                  <div>ดำเนินการเมื่อ {formatDate(leaveData.status4_update)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className={styles.stepContainer}>
          <div className={styles.stepHeader}>
            <div className={`${styles.stepIcon} ${getStepIconClass(3)}`}></div>
            <div className={styles.stepTitle}>ขั้นตอนที่ 3</div>
            <div className={styles.stepBadge}>
              {leaveData.status5 !== null ? '1/1 ดำเนินการเสร็จสิ้น' : leaveData.status4 !== null ? '0/1 กำลังดำเนินการ' : leaveData.status2 == false ? '0/2 ไม่สามารถดำเนินการได้' : leaveData.status4 == null ? '0/2 รอการดำเนินการ' : '0/2 กำลังดำเนินการ'}
            </div>
          </div>
          <div className={styles.stepContent}>
            <div className={`${styles.taskItem} ${leaveData.status5 === true ? styles.completed : 
                          leaveData.status5 === false ? styles.rejected : 
                          leaveData.status4 !== null ? styles.inProgress : styles.pending}`}>
              <div className={`${styles.taskIcon} ${getTaskIcon(leaveData.status5, leaveData.status4).className}`}>
                {getTaskIcon(leaveData.status5, leaveData.status4).content}
              </div>
              <div className={styles.taskDetails}>
                <div className={styles.taskTitle}>ปลัดเทศบาลพิจารณาคำร้อง</div>
                <div className={styles.taskSubtitle}>
                  {leaveData.mayor_firstname} {leaveData.mayor_lastname}
                  <div className="comment" style={{marginTop:'0.5rem'}}>
                  {`ความคิดเห็น : ${leaveData.mayor_note}`}
                  </div>
                </div>
              </div>
              <div className={styles.taskStatus}>
                <div className={styles.taskStatusMain}>
                  {getStatusText(5, leaveData.status5)}
                </div>
                {leaveData.status5_update && (
                  <div>ดำเนินการเมื่อ {formatDate(leaveData.status5_update)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetail;