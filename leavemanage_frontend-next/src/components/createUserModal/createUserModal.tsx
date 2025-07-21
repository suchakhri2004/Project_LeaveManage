'use client';
import React, { useEffect, useState } from 'react';
import styles from './createUserModal.module.scss';

interface Affiliation {
  id: string;
  name: string;
}

interface Position {
  id: string;
  positionname: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    prefix: '',
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    gender: '',
    affiliation_id: '',
    position_id: '',
  });

  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    if (!isOpen) return; // โหลดข้อมูลเฉพาะตอนเปิด modal

    fetch('/api/superadmin/affiliations')
      .then((res) => res.json())
      .then(setAffiliations);

    fetch('/api/superadmin/positions')
      .then((res) => res.json())
      .then(setPositions);
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/superadmin/createUserAndAdmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert('สร้างผู้ใช้งานเรียบร้อย');
      onClose();
      if (onSuccess) onSuccess();
      setFormData({
        username: '',
        password: '',
        prefix: '',
        firstname: '',
        lastname: '',
        phone: '',
        email: '',
        gender: '',
        affiliation_id: '',
        position_id: '',
      });
    } else {
      alert('สร้างผู้ใช้งานล้มเหลว');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>เพิ่มผู้ใช้งาน</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>เลขบัตรประชาชน</label>
              <input name="username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>รหัสผ่าน (วัน/เดือน/ปีเกิด)</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>คำนำหน้า</label>
              <input name="prefix" value={formData.prefix} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>ชื่อ</label>
              <input name="firstname" value={formData.firstname} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>นามสกุล</label>
              <input name="lastname" value={formData.lastname} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>เบอร์โทร</label>
              <input name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>อีเมล</label>
              <input name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>เพศ</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">-- เลือกเพศ --</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>สังกัดกอง</label>
              <select name="affiliation_id" value={formData.affiliation_id} onChange={handleChange}>
                <option value="">-- เลือกสังกัดกอง --</option>
                {affiliations.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>ตำแหน่ง</label>
              <select name="position_id" value={formData.position_id} onChange={handleChange}>
                <option value="">-- เลือกตำแหน่ง --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.positionname}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.buttonRow}>
            <button type="submit">บันทึก</button>
            <button type="button" onClick={onClose}>ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
