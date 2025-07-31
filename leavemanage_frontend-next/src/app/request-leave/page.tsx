'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navbar/Navbar';
import styles from './request-leave.module.scss';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import ConfirmPopup from '../../components/confirm-popup/confirmPopup';

interface Profile {
  profile: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({
    leaveTypeId: '',
    reason: '',
    startDate: '',
    endDate: '',
    contact: '',
    responsibleId: ''
  });

  // Convert replacementList to format expected by react-select
  const replacementOptions = replacementList.map(rep => ({
    value: rep.id,
    label: rep.name
  }));

  // Cloudinary configuration - แก้ไขแล้ว
  const CLOUDINARY_CLOUD_NAME = 'Suchakhri';
  const CLOUDINARY_API_KEY = '789196327133977';
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:9898/api/dashboard/getProfile', {
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
        const res = await fetch('http://localhost:9898/api/dashboard/leaveBalance', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLeaveBalances(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchLeaveTypes = async () => {
      try {
        const res = await fetch('http://localhost:9898/api/form/getValueLeaveType', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLeaveTypes(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchReplacementList = async () => {
      try {
        const res = await fetch('http://localhost:9898/api/form/getAllUsers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReplacementList(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchLeaveBalance();
    fetchLeaveTypes();
    fetchReplacementList();
  }, [router]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      leaveTypeId: '',
      reason: '',
      startDate: '',
      endDate: '',
      contact: '',
      responsibleId: ''
    };

    if (!leaveTypeId) {
      newErrors.leaveTypeId = 'กรุณาเลือกประเภทการลา';
      valid = false;
    }
    if (!reason) {
      newErrors.reason = 'กรุณากรอกเหตุผล';
      valid = false;
    }
    if (!startDate) {
      newErrors.startDate = 'กรุณาเลือกวันที่เริ่มลา';
      valid = false;
    }
    if (!endDate) {
      newErrors.endDate = 'กรุณาเลือกวันที่สิ้นสุดการลา';
      valid = false;
    }
    if (!contact) {
      newErrors.contact = 'กรุณากรอกช่องทางการติดต่อ';
      valid = false;
    }
    if (!responsibleId) {
      newErrors.responsibleId = 'กรุณาเลือกผู้ที่จะมีปฏิบัติงานแทนท่าน';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // ตรวจสอบขนาดไฟล์ (เช่น ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // ฟังก์ชันอัปโหลดไฟล์ที่แก้ไขแล้ว
  const uploadToCloudinary = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    const timestamp = Math.round(Date.now() / 1000);
    
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'leave-attachments');
    formData.append('resource_type', 'image');

    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error:', errorData);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const submitLeaveRequest = async () => {
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      let imageUrl = null;
      
      // อัปโหลดรูปภาพก่อน (ถ้ามี)
      if (selectedFile) {
        imageUrl = await uploadToCloudinary(selectedFile);
      }

      const body = {
        leavetype_id: leaveTypeId,
        reason,
        proof_image_url: imageUrl,
        datefrom: startDate,
        dateto: endDate,
        contact,
        responsible_person_id: responsibleId,
      };

      const res = await fetch('http://localhost:9898/api/form/leaveRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      alert('ส่งคำขอลาสำเร็จ');
      router.push('/home-employee');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการส่งคำขอ');
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setShowConfirmPopup(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmPopup(true);
    }
  };

  return (
    <div className={styles['request-leave-page']}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.boxleft}>
          <div className={styles['profile-box']}>
            <img src={profile?.profile} alt="Profile Image" className={styles['profile-image']} />
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
              <label htmlFor="leavetype">
                โปรดเลือกประเภทที่ท่านต้องการลา<span className={styles.required}>*</span>
              </label>
              <select
                id="leavetype"
                name="leavetype"
                className={`${styles['form-control']} ${errors.leaveTypeId ? styles.error : ''}`}
                onChange={(e) => setLeaveTypeId(e.target.value)}
              >
                <option value="">-- กรุณาเลือก --</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.leaveTypeId && <span className={styles['error-message']}>{errors.leaveTypeId}</span>}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="reason">
                ระบุเหตุผลในการลาของท่าน<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="reason"
                placeholder="เหตุผล"
                className={`${styles['form-control']} ${errors.reason ? styles.error : ''}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {errors.reason && <span className={styles['error-message']}>{errors.reason}</span>}
            </div>

            <div className={styles['form-group']}>
              <label>
                โปรดระบุวันที่ต้องการลา<span className={styles.required}>*</span>
              </label>
              <div className={styles['date-range']}>
                <div className={styles['date-input']}>
                  <label htmlFor="startdate">
                    วัน/เดือน/ปี<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="startdate"
                    className={`${styles['form-control']} ${errors.startDate ? styles.error : ''}`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {errors.startDate && <span className={styles['error-message']}>{errors.startDate}</span>}
                </div>
                <span className={styles['date-separator']}>ถึง</span>
                <div className={styles['date-input']}>
                  <label htmlFor="enddate">
                    วัน/เดือน/ปี<span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    id="enddate"
                    className={`${styles['form-control']} ${errors.endDate ? styles.error : ''}`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {errors.endDate && <span className={styles['error-message']}>{errors.endDate}</span>}
                </div>
              </div>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="attachment">แนบหลักฐานที่ใช้สำหรับการลา</label>
              <input
                type="file"
                id="attachment"
                accept="image/*"
                className={styles['file-input']}
                onChange={handleFileChange}
              />
              {selectedFile && (
                <div className={styles['file-info']}>
                  <p>ไฟล์ที่เลือก: {selectedFile.name}</p>
                  <p>ขนาด: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
              {isUploading && (
                <div className={styles['upload-progress']}>
                  <div className={styles['progress-bar']}>
                    <div 
                      className={styles['progress-fill']} 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p>กำลังอัปโหลด... {uploadProgress}%</p>
                </div>
              )}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="contact">
                ระบุการติดต่อของท่านในระหว่างลา<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="contact"
                placeholder="กรอกช่องทางการติดต่อ"
                className={`${styles['form-control']} ${errors.contact ? styles.error : ''}`}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
              {errors.contact && <span className={styles['error-message']}>{errors.contact}</span>}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="replacement">
                โปรดเลือกผู้ที่จะมีปฏิบัติงานแทนท่าน<span className={styles.required}>*</span>
              </label>
              <Select
                id="replacement"
                options={replacementOptions}
                placeholder="-- กรุณาเลือก --"
                isSearchable
                onChange={(selectedOption) => {
                  setResponsibleId(selectedOption?.value || '');
                  setErrors(prev => ({...prev, responsibleId: ''}));
                }}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '40px',
                    borderRadius: '4px',
                    border: `1px solid ${errors.responsibleId ? 'red' : '#ced4da'}`,
                    '&:hover': {
                      border: `1px solid ${errors.responsibleId ? 'red' : '#ced4da'}`
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
                className={styles['react-select-container']}
                classNamePrefix="react-select"
              />
              {errors.responsibleId && <span className={styles['error-message']}>{errors.responsibleId}</span>}
            </div>

            <div className={styles['form-actions']}>
              <button 
                type="submit" 
                className={styles['btn-submit']} 
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? 'กำลังส่ง...' : isUploading ? 'กำลังอัปโหลด...' : 'ยืนยัน'}
              </button>
              <button
                type="button"
                className={styles['btn-cancel']}
                onClick={() => setShowCancelPopup(true)}
                disabled={isSubmitting || isUploading}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
      {showConfirmPopup && (
        <ConfirmPopup
          message="ท่านยืนยันที่จะส่งคำร้องขอลาใช่หรือไม่?"
          onConfirm={submitLeaveRequest}
          onCancel={() => setShowConfirmPopup(false)}
        />
      )}
      {showCancelPopup && (
        <ConfirmPopup
          message="ท่านต้องการยกเลิกส่งคำร้องขอลาใช่หรือไม่"
          onConfirm={() => router.push('/home-employee')}
          onCancel={() => setShowCancelPopup(false)}
        />
      )}
    </div>
  );
}

export default Page;