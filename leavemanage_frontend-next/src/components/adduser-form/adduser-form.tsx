'use client';
import React from 'react';
import styles from './adduser-form.module.scss';

import { 
  AffiliationOption, 
  PositionOption
} from '../../app/types/interfaceall';

interface NewUserData {
  profile: string;
  username: string;
  password: string;
  prefix: string;
  firstname: string;
  lastname: string;
  email: string;
  gender: string;
  affiliation_id: string;
  position_id: string;
}

interface AddUserFormProps {
  newUserData: NewUserData;
  setNewUserData: (data: NewUserData) => void;
  handleCreateUser: () => void;
  cancelAddUser: () => void;
  uploadingImage: boolean;
  triggerFileInput: () => void;
  affiliationOptions: AffiliationOption[];
  positionOptions: PositionOption[];
  createUserLoading: boolean;
  prefixOptions: { value: string; label: string }[];
  genderOptions: { value: string; label: string }[];
}

const AddUserForm = ({
  newUserData,
  setNewUserData,
  handleCreateUser,
  cancelAddUser,
  uploadingImage,
  triggerFileInput,
  affiliationOptions,
  positionOptions,
  createUserLoading,
  prefixOptions,
  genderOptions,
}: AddUserFormProps) => {
  return (
    <>
      <h3>เพิ่มผู้ใช้งานใหม่</h3>
      <div className={styles.formGrid}>
        {/* Profile Picture */}
        <div className={styles.profilePic} style={{ gridColumn: 'span 2', marginBottom: 20, textAlign: 'center' }}>
          <img
            src={newUserData.profile}
            alt="Profile"
            style={{ borderRadius: '50%', width: 120, height: 120, objectFit: 'cover' }}
          />
          <div style={{ marginTop: 10 }}>
            <button
              className={styles.uploadButton}
              onClick={triggerFileInput}
              disabled={uploadingImage}
            >
              {uploadingImage ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
            </button>
          </div>
        </div>

        {/* Username */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>เลขบัตรประชาชน<span className={styles.required}>*</span></label>
          <input
            type="text"
            className={styles.formInput}
            value={newUserData.username}
            onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
            placeholder="เลขบัตรประชาชน 13 หลัก"
          />
        </div>

        {/* Password */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>รหัสผ่าน<span className={styles.required}>*</span></label>
          <input
            type="password"
            className={styles.formInput}
            value={newUserData.password}
            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
            placeholder="รหัสผ่าน"
          />
        </div>

        {/* Prefix */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>คำนำหน้า<span className={styles.required}>*</span></label>
          <select
            className={styles.formSelect}
            value={newUserData.prefix}
            onChange={(e) => setNewUserData({ ...newUserData, prefix: e.target.value })}
          >
            {prefixOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Firstname */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ชื่อ<span className={styles.required}>*</span></label>
          <input
            type="text"
            className={styles.formInput}
            value={newUserData.firstname}
            onChange={(e) => setNewUserData({ ...newUserData, firstname: e.target.value })}
            placeholder="ชื่อ"
          />
        </div>

        {/* Lastname */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>นามสกุล<span className={styles.required}>*</span></label>
          <input
            type="text"
            className={styles.formInput}
            value={newUserData.lastname}
            onChange={(e) => setNewUserData({ ...newUserData, lastname: e.target.value })}
            placeholder="นามสกุล"
          />
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>อีเมล<span className={styles.required}>*</span></label>
          <input
            type="email"
            className={styles.formInput}
            value={newUserData.email}
            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
            placeholder="อีเมล"
          />
        </div>

        {/* Gender */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>เพศ<span className={styles.required}>*</span></label>
          <select
            className={styles.formSelect}
            value={newUserData.gender}
            onChange={(e) => setNewUserData({ ...newUserData, gender: e.target.value })}
          >
            {genderOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Affiliation */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>สังกัดกอง</label>
          <select
            className={styles.formSelect}
            value={newUserData.affiliation_id}
            onChange={(e) => setNewUserData({ ...newUserData, affiliation_id: e.target.value })}
          >
            <option value="">เลือกสังกัด</option>
            {affiliationOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ตำแหน่ง<span className={styles.required}>*</span></label>
          <select
            className={styles.formSelect}
            value={newUserData.position_id}
            onChange={(e) => setNewUserData({ ...newUserData, position_id: e.target.value })}
          >
            <option value="">เลือกตำแหน่ง</option>
            {positionOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.positionname}
              </option>
            ))}
          </select>
        </div>

        {/* Create / Cancel buttons */}
        <div className={styles.formGroup} style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleCreateUser}
            disabled={createUserLoading}
            style={{ flex: 1 }}
          >
            {createUserLoading ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={cancelAddUser}
            disabled={createUserLoading}
            style={{ flex: 1 }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </>
  );
};

export default AddUserForm;