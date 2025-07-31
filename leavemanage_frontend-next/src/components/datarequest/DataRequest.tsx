"use client";

import React, { useEffect, useState } from 'react';
import styles from './datarequest.module.scss';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import ConfirmPopup from '../confirm-popup/confirmPopup';

interface LeaveRequest {
  employee_name: string;
  reason: string;
  proof_image_url: string | null;
  contact: string;
  responsible_person_name: string;
  leave_type_name: string;
  datefrom: string;
  dateto: string;
  status2: boolean | null;
  status3: boolean | null;
  status4: boolean | null;
  supervisor_note: string;
  deputymayor_note: string;
}

interface LeaveStatusHistory {
  status1_update: string;
  status2_update: string;
  status3_update: string;
  status4_update: string;
}

const LeaveRequestDetailMock = () => {
  const router = useRouter();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [statusHistory, setStatusHistory] = useState<LeaveStatusHistory | null>(null);
  const [supervisorNote, setSupervisorNote] = useState('');
  const [deputyNote, setDeputyNote] = useState('');
  const [mayorNote, setMayorNote] = useState('');
  const [confirmPopup, setConfirmPopup] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      try {
        const res1 = await fetch(`http://localhost:9898/api/dashboard/viewLeaveRequestById/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const leaveData = await res1.json();
        setLeaveRequest(leaveData);
        setSupervisorNote(leaveData.supervisor_note);
        setDeputyNote(leaveData.deputymayor_note);

        const res2 = await fetch(`http://localhost:9898/api/dashboard/leaveData/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusData = await res2.json();
        setStatusHistory(statusData[0]);
      } catch (error) {
        console.error('Error loading leave request:', error);
      }
    };

    fetchData();
  }, []);

  if (!leaveRequest || !statusHistory) return <div>Loading...</div>;

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const dt = new Date(dateStr);
    return dt.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleHrApproval = (decision: boolean) => {
    setConfirmPopup({
      message: decision
        ? 'ท่านยืนยันที่จะส่งคำร้องขอลาไปยังผู้อำนวยการฝ่ายใช่หรือไม่'
        : 'ท่านยืนยันปฏิเสธคำร้องขอลาใช่หรือไม่',
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        try {
          await fetch(`http://localhost:9898/api/form/acceptHr/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ boolean: decision }),
          });
          router.push('/check-request');
        } catch (error) {
          console.error('Error submitting HR decision:', error);
        }
      },
    });
  };

  const handleOpinionSubmit = (note: string, role: 'supervisor' | 'deputy') => {
    const message =
      role === 'supervisor'
        ? 'ท่านยืนยันที่จะส่งคำร้องขอลาไปยังรองปลัดเทศบาลใช่หรือไม่'
        : 'ท่านยืนยันที่จะส่งคำร้องขอลาไปยังปลัดเทศบาลใช่หรือไม่';

    setConfirmPopup({
      message,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        try {
          await fetch(`http://localhost:9898/api/form/opinionsOnly/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ note }),
          });
          router.push('/check-request');
        } catch (error) {
          console.error('Error submitting opinion:', error);
        }
      },
    });
  };

  const handleMayorDecision = (decision: boolean) => {
    setConfirmPopup({
      message: decision
        ? 'ท่านยืนยันที่อนุมัติคำร้องขอลาใช่หรือไม่'
        : 'ท่านยืนยันที่จะปฏิเสธคำร้องขอลาใช่หรือไม่',
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        try {
          await fetch(`http://localhost:9898/api/form/approveLeaveRequest/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ note: mayorNote, boolean: decision }),
          });
          router.push('/check-request');
        } catch (error) {
          console.error('Error submitting mayor decision:', error);
        }
      },
    });
  };

  const renderApprovalHistory = () => {
    return (
      <div className={styles.approvalHistory}>
        {leaveRequest.status2 && (
          <div className={styles.historyItem}>
            <strong>นักทรัพยากรบุคคลชำนาญการ</strong><br />
            ดำเนินการตรวจสอบ: ผ่านการทดสอบ<br />
            เมื่อ: {formatDateTime(statusHistory.status2_update)}<br />
          </div>
        )}
        {leaveRequest.status3 && (
          <div className={styles.historyItem}>
            <strong>ผู้บังคับบัญชาออกความเห็น</strong><br />
            ความคิดเห็น: {leaveRequest.supervisor_note || '-'}<br />
            เมื่อ: {formatDateTime(statusHistory.status3_update)}<br />
          </div>
        )}
        {leaveRequest.status4 && (
          <div className={styles.historyItem}>
            <strong>รองปลัดเทศบาลออกความเห็น</strong><br />
            ความคิดเห็น: {leaveRequest.deputymayor_note || '-'}<br />
            เมื่อ: {formatDateTime(statusHistory.status4_update)}<br />
          </div>
        )}
      </div>
    );
  };

  const renderButtonsAndInput = () => {
    const { status2, status3, status4 } = leaveRequest;
    if (status2 === null) {
      return (
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={() => handleHrApproval(true)}>อนุมัติ</button>
          <button className={`${styles.button} ${styles.danger}`} onClick={() => handleHrApproval(false)}>ปฏิเสธ</button>
        </div>
      );
    } else if (status2 === true && status3 === null) {
      return (
        <div className={styles.approvalItem}>
          <div className={styles.sectionHeader}>ผู้บังคับบัญชาออกความเห็น</div>
          <textarea
            className={styles.textarea}
            value={supervisorNote}
            onChange={(e) => setSupervisorNote(e.target.value)}
          />
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={() => handleOpinionSubmit(supervisorNote, 'supervisor')}>ยืนยัน</button>
          </div>
        </div>
      );
    } else if (status3 === true && status4 === null) {
      return (
        <div className={styles.approvalItem}>
          <div className={styles.sectionHeader}>รองปลัดเทศบาลออกความเห็น</div>
          <textarea
            className={styles.textarea}
            value={deputyNote}
            onChange={(e) => setDeputyNote(e.target.value)}
          />
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={() => handleOpinionSubmit(deputyNote, 'deputy')}>ยืนยัน</button>
          </div>
        </div>
      );
    } else if (status4 === true) {
      return (
        <div className={styles.approvalItem}>
          <div className={styles.sectionHeader}>ปลัดเทศบาลออกความเห็น</div>
          <textarea
            className={styles.textarea}
            value={mayorNote}
            onChange={(e) => setMayorNote(e.target.value)}
          />
          <div className={styles.buttonGroup}>
            <button className={styles.button} onClick={() => handleMayorDecision(true)}>อนุมัติ</button>
            <button className={`${styles.button} ${styles.danger}`} onClick={() => handleMayorDecision(false)}>ปฏิเสธ</button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <div className={styles.label}>ผู้ส่งคำร้อง</div>
          <div className={styles.colon}>:</div>
          <div className={styles.value}>{leaveRequest.employee_name}</div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.label}>ประเภทการลา</div>
          <div className={styles.colon}>:</div>
          <div className={styles.value}>{leaveRequest.leave_type_name}</div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.label}>เหตุผลในการลา</div>
          <div className={styles.colon}>:</div>
          <div className={styles.value}>{leaveRequest.reason}</div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.label}>วันที่ลา</div>
          <div className={styles.colon}>:</div>
          <div className={styles.value}>
            {new Date(leaveRequest.datefrom).toLocaleDateString('th-TH')} - {new Date(leaveRequest.dateto).toLocaleDateString('th-TH')}
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.label}>หลักฐานที่ใช้สำหรับการลา</div>
          <div className={styles.colon}>:</div>
          <div className={styles.value}>
            {leaveRequest.proof_image_url ? (
              <a href={leaveRequest.proof_image_url} target="_blank" rel="noreferrer" className={styles.link}>
                ดูหลักฐานการลา
              </a>
            ) : (
              <span className={styles.emptyField}>ไม่มีหลักฐาน</span>
            )}
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.label}>การติดต่อในระหว่างลา</div>
          <div className={styles.colon}>:</div>
          <div className={`${styles.value} ${styles.address}`}>{leaveRequest.contact}</div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.label}>ผู้ที่จะมีปฏิบัติงานแทน</div>
          <div className={styles.colon}>:</div>
          <div className={styles.value}>{leaveRequest.responsible_person_name}</div>
        </div>

        {renderApprovalHistory()}

        {renderButtonsAndInput()}
      </div>

      {confirmPopup && (
        <ConfirmPopup
          message={confirmPopup.message}
          onConfirm={() => {
            confirmPopup.onConfirm();
            setConfirmPopup(null);
          }}
          onCancel={() => setConfirmPopup(null)}
        />
      )}
    </div>
  );
};

export default LeaveRequestDetailMock;
