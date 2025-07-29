'use client';

import React, { useEffect, useState } from 'react';
import styles from './history.module.scss';
import Navbar from '../../components/navbar/Navbar';
import { useRouter } from 'next/navigation';
import { MdOutlineSkipPrevious, MdOutlineSkipNext } from "react-icons/md";
import { GrChapterPrevious, GrChapterNext } from "react-icons/gr";
import { TiDocumentText } from "react-icons/ti";

interface LeaveHistoryItem {
  numrequest: number;
  id: number;
  createdAt: string;
  leave_type_name: string;
  status: string;
}

const RequestTable = () => {
  const router = useRouter();

  const [requests, setRequests] = useState<LeaveHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchLeaveHistory = async (page: number, customLimit = limit) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`http://localhost:9898/api/dashboard/leaveHistory?page=${page}&limit=${customLimit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      setRequests(result.data);
      setCurrentPage(result.page);
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / result.limit));
    } catch (error) {
      console.error('Error fetching leave history:', error);
    }
  };

  useEffect(() => {
    fetchLeaveHistory(currentPage, limit);
  }, [currentPage, limit]);

  const handleGoToPage = (page: number | string) => {
    if (typeof page === 'string') {
      switch (page) {
        case 'first':
          setCurrentPage(1);
          break;
        case 'prev':
          setCurrentPage((prev) => Math.max(prev - 1, 1));
          break;
        case 'next':
          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
          break;
        case 'last':
          setCurrentPage(totalPages);
          break;
      }
    } else {
      setCurrentPage(page);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const getStatusClass = (status: string) => {
  switch (status) {
    case 'กำลังดำเนินการ':
      return styles.statusPending;
    case 'สำเร็จ':
      return styles.statusSuccess;
    case 'ไม่สำเร็จ':
      return styles.statusFailed;
    default:
      return '';
  }
};


  return (
    <div className={styles['history-page']}>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>ประวัติการลา</h1>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <label style={{ marginRight: '8px' }}>แสดงต่อหน้า:</label>
          <select value={limit} onChange={handleLimitChange}>
            <option value={10}>10 รายการ</option>
            <option value={15}>15 รายการ</option>
            <option value={20}>20 รายการ</option>
          </select>
        </div>

        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>รหัสคำร้อง</th>
                <th>วันที่ทำเรื่อง</th>
                <th>ประเภทการลา</th>
                <th>สถานะ</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
                {[...requests]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((req) => (
                    <tr key={req.id}>
                      <td>{req.numrequest}</td>
                      <td>{new Date(req.createdAt).toLocaleDateString('th-TH')}</td>
                      <td>{req.leave_type_name}</td>
                      <td className={getStatusClass(req.status)}>{req.status}</td>
                      <td>
                        <TiDocumentText
                          className={styles.editIcon}
                          size={30}
                          onClick={() => router.push(`/processDetail?id=${req.id}`)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                ))}
              </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            แสดง {requests.length} จากทั้งหมด {totalItems} รายการ | หน้า {currentPage} จาก {totalPages}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.navBtn}
              onClick={() => handleGoToPage('first')}
              disabled={currentPage === 1}
              aria-label="ไปหน้าแรก"
            >
              <GrChapterPrevious size={20} />
            </button>

            <button
              className={styles.navBtn}
              onClick={() => handleGoToPage('prev')}
              disabled={currentPage === 1}
              aria-label="หน้าก่อนหน้า"
            >
              <MdOutlineSkipPrevious size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                className={`${styles.pageBtn} ${pageNum === currentPage ? styles.active : ''}`}
                onClick={() => handleGoToPage(pageNum)}
                aria-label={`หน้า ${pageNum}`}
              >
                {pageNum}
              </button>
            ))}

            <button
              className={styles.navBtn}
              onClick={() => handleGoToPage('next')}
              disabled={currentPage === totalPages}
              aria-label="หน้าถัดไป"
            >
              <MdOutlineSkipNext size={20} />
            </button>

            <button
              className={styles.navBtn}
              onClick={() => handleGoToPage('last')}
              disabled={currentPage === totalPages}
              aria-label="ไปหน้าสุดท้าย"
            >
              <GrChapterNext size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTable;
