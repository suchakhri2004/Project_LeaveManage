'use client';
import React, { useState, useEffect } from 'react';
import styles from './user-detail.module.scss';
import { 
  AffiliationOption, 
  PositionOption,
} from '../../app/types/interfaceall';

interface UserItem {
  id: string;
  username: string;
  prefix: string;
  firstname: string;
  lastname: string;
  email: string;
  gender: string;
  affiliation_name: string | null;
  position_name: string | null;
  affiliation_id: string | null;
  position_id: string | null;
  isactive: boolean;
  profile: string;
}

interface EditedUserData {
  firstname: string;
  lastname: string;
  email: string;
  affiliation_id: string;
  position_id: string;
  profile: string;
}

interface LeaveBalance {
  leavetype_id: string;
  total_days: string;
  used_days: string;
  name: string;
}

interface UserListProps {
  user: UserItem;
  editMode: boolean;
  editedData: EditedUserData;
  setEditedData: (data: EditedUserData) => void;
  setEditMode: (mode: boolean) => void;
  saveChanges: () => void;
  cancelEdit: () => void;
  uploadingImage: boolean;
  triggerFileInput: () => void;
  affiliationOptions: AffiliationOption[];
  positionOptions: PositionOption[];
  saveLoading: boolean;
}

const UserList = ({
  user,
  editMode,
  editedData,
  setEditedData,
  setEditMode,
  saveChanges,
  cancelEdit,
  uploadingImage,
  triggerFileInput,
  affiliationOptions,
  positionOptions,
  saveLoading,
}: UserListProps) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [editedLeaveBalances, setEditedLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(false);
  const [saveLeaveLoading, setSaveLeaveLoading] = useState(false);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch leave balance data
  const fetchLeaveBalance = async () => {
    setLeaveBalanceLoading(true);
    try {
      const token = getToken();
      if (!token) {
        alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch(`http://localhost:9898/api/superadmin/leaveBalanceByID/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveBalances(data);
        setEditedLeaveBalances([...data]);
      } else if (response.status === 401) {
        alert('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('token');
      } else {
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลวันลา');
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLeaveBalanceLoading(false);
    }
  };

  const saveLeaveBalanceChanges = async () => {
    setSaveLeaveLoading(true);
    try {
      const token = getToken();
      if (!token) {
        alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const leaveDataToSave = editedLeaveBalances.map(leave => ({
        leavetype_id: leave.leavetype_id,
        total_days: Number(leave.total_days),
      }));

      const response = await fetch(`http://localhost:9898/api/superadmin/editLeaveDay/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveUpdates:leaveDataToSave,
        }),
      });

      if (response.ok) {
        await fetchLeaveBalance();
        alert('บันทึกข้อมูลวันลาสำเร็จ');
      } else if (response.status === 401) {
        alert('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('token');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error saving leave balance:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaveLeaveLoading(false);
    }
  };

  // Combined save function for both user data and leave balance
  const handleSaveChanges = async () => {
    await saveChanges(); // Save user data first
    if (editedLeaveBalances.length > 0) {
      await saveLeaveBalanceChanges(); // Then save leave balance
    }
  };

  // Cancel leave balance edit
  const cancelLeaveBalanceEdit = () => {
    setEditedLeaveBalances([...leaveBalances]);
  };

  // Combined cancel function
  const handleCancelEdit = () => {
    cancelEdit();
    cancelLeaveBalanceEdit();
  };

  // Update leave balance total days
  const updateLeaveBalance = (index: number, totalDays: string) => {
    const updated = [...editedLeaveBalances];
    updated[index] = { ...updated[index], total_days: totalDays };
    setEditedLeaveBalances(updated);
  };

    useEffect(() => {
      fetchLeaveBalance();
      setEditedLeaveBalances([]); // รีเซ็ตเมื่อเปลี่ยนผู้ใช้
    }, [user.id]);

  return (
    <>
      <h3>ข้อมูลผู้ใช้งาน</h3>
      <div className={styles.formGrid}>
        {/* Profile Picture */}
        <div className={styles.profilePic} style={{ gridColumn: 'span 2', marginBottom: 20, textAlign: 'center' }}>
          <img
            src={editedData.profile}
            alt="Profile"
            style={{ borderRadius: '50%', width: 120, height: 120, objectFit: 'cover' }}
          />
          {editMode && (
            <div style={{ marginTop: 10 }}>
              <button
                className={styles.uploadButton}
                onClick={triggerFileInput}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
              </button>
            </div>
          )}
        </div>

        {/* ID */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>เลขบัตรประชาชน</label>
          <input type="text" className={styles.formInput} value={user.username} disabled />
        </div>

        {/* Gender */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>เพศ</label>
          <input type="text" className={styles.formInput} value={user.gender} disabled />
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>อีเมล</label>
          <input
            type="email"
            className={styles.formInput}
            disabled
            value={editedData.email}
            onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
          />
        </div>

        <br />

        {/* Firstname */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ชื่อ</label>
          <input 
            type="text" 
            className={styles.formInput} 
            value={editedData.firstname} 
            disabled={!editMode}
            onChange={(e) => setEditedData({ ...editedData, firstname: e.target.value })}
          />
        </div>

        {/* Lastname */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>นามสกุล</label>
          <input 
            type="text" 
            className={styles.formInput} 
            value={editedData.lastname} 
            disabled={!editMode}
            onChange={(e) => setEditedData({ ...editedData, lastname: e.target.value })}
          />
        </div>

        {/* Affiliation */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>สังกัดกอง</label>
          {editMode ? (
            <select
              className={styles.formSelect}
              value={editedData.affiliation_id}
              onChange={(e) => setEditedData({ ...editedData, affiliation_id: e.target.value })}
            >
              <option value="">เลือกสังกัด</option>
              {affiliationOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className={styles.formInput}
              value={user.affiliation_name || 'ไม่มีข้อมูล'}
              disabled
            />
          )}
        </div>

        {/* Position */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ตำแหน่ง</label>
          {editMode ? (
            <select
              className={styles.formSelect}
              value={editedData.position_id}
              onChange={(e) => setEditedData({ ...editedData, position_id: e.target.value })}
            >
              <option value="">เลือกตำแหน่ง</option>
              {positionOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.positionname}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className={styles.formInput}
              value={user.position_name || 'ไม่มีข้อมุล'}
              disabled
            />
          )}
        </div>

      {/* Leave Balance Section - integrated with main form */}
      {editedLeaveBalances.map((leave, index) => (
        <div key={leave.leavetype_id || index} className={styles.formGroup}>
          <label className={styles.formLabel}>
            {leave.name} (ใช้ไปแล้ว: {leave.used_days} วัน)
          </label>
          <input 
            type="number" 
            className={styles.formInput} 
            value={leave.total_days} 
            disabled={!editMode}
            onChange={(e) => updateLeaveBalance(index, e.target.value)}
            placeholder="จำนวนวัน"
            min="0"
          />
        </div>
      ))}
        {/* Edit / Save / Cancel buttons */}
        <div className={styles.formGroup} style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
          {!editMode ? (
            <button 
              type="button" 
              className={styles.editBtn} 
              onClick={() => setEditMode(true)} 
              style={{ flex: 1 }}
            >
              แก้ไข
            </button>
          ) : (
            <>
              <button 
                type="button" 
                className={styles.saveBtn} 
                onClick={handleSaveChanges} 
                disabled={saveLoading || saveLeaveLoading}
                style={{ flex: 1 }}
              >
                {(saveLoading || saveLeaveLoading) ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={handleCancelEdit} 
                disabled={saveLoading || saveLeaveLoading}
                style={{ flex: 1 }}
              >
                ยกเลิก
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UserList;