'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from './superadmin-dashboard.module.scss';

// Interfaces
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

interface AffiliationOption {
  id: string;
  name: string;
}

interface PositionOption {
  id: string;
  positionname: string;
}

// Constants
const genderOptions = [
  { value: '', label: 'เลือกเพศ' },
  { value: 'ชาย', label: 'ชาย' },
  { value: 'หญิง', label: 'หญิง' },
];

const prefixOptions = [
  { value: '', label: 'เลือกคำนำหน้า' },
  { value: 'นาย', label: 'นาย' },
  { value: 'นางสาว', label: 'นางสาว' },
  { value: 'นาง', label: 'นาง' },
];

const CLOUDINARY_CLOUD_NAME = 'dkilzjefh';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

const SuperAdminDashboard = () => {
  // State for user statistics
  const [userStats, setUserStats] = useState({
    total_users: '0',
    active_users: '0',
    inactive_users: '0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for user search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // State for user editing
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    affiliation_id: '',
    position_id: '',
    profile: '',
  });
  console.log(editedData,"<=====editedData")
  const [saveLoading, setSaveLoading] = useState(false);

  const [affiliationOptions, setAffiliationOptions] = useState<AffiliationOption[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);

  const [addUserMode, setAddUserMode] = useState(false);
  const [newUserData, setNewUserData] = useState({
    profile: DEFAULT_PROFILE_IMAGE,
    username: '',
    password: '',
    prefix: '',
    firstname: '',
    lastname: '',
    email: '',
    gender: '',
    affiliation_id: '',
    position_id: '',
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // State for image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions
  const getAffiliationNameById = (id: string) => {
    const affiliation = affiliationOptions.find(a => a.id === id);
    return affiliation ? affiliation.name : '';
  };

  const getPositionNameById = (id: string) => {
    const position = positionOptions.find(p => p.id === id);
    return position ? position.positionname : '';
  };

  // Image upload handler
  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.match('image.*')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('ขนาดไฟล์ไม่ควรเกิน 5MB');
      return;
    }

    try {
      const imageUrl = await uploadImage(file);
      if (addUserMode) {
        setNewUserData({ ...newUserData, profile: imageUrl });
      } else if (selectedUser) {
        setEditedData({ ...editedData, profile: imageUrl });
      }
    } catch (error) {
      alert('อัปโหลดรูปภาพไม่สำเร็จ');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // API fetch functions
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:9898/api/superadmin/countusers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user statistics');
      const data = await response.json();
      setUserStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliations = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:9898/api/superadmin/getValueAffiliation', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch affiliations');
      const data = await response.json();
      setAffiliationOptions(data);
    } catch (err) {
      console.error('Error fetching affiliations:', err);
    }
  };

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:9898/api/superadmin/getValuePosition', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositionOptions(data);
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  const fetchUsers = async (query: string = '') => {
    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch(
        `http://localhost:9898/api/superadmin/searchUsers?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSearchResults(data);
      if (!selectedUser && data.length > 0 && !addUserMode) selectUser(data[0]);
      if (data.length === 0 && !addUserMode) setSelectedUser(null);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchUserStats();
    fetchUsers();
    fetchAffiliations();
    fetchPositions();
  }, []);

  // Search debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchTerm.trim());
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Update edited data when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setEditedData({
        firstname: selectedUser.firstname,
        lastname: selectedUser.lastname,
        email: selectedUser.email,
        affiliation_id: selectedUser.affiliation_id || '',
        position_id: selectedUser.position_id || '',
        profile: selectedUser.profile || DEFAULT_PROFILE_IMAGE,
      });
      setEditMode(false);
    }
  }, [selectedUser]);

  // User selection
  const selectUser = (user: UserItem) => {
    setSelectedUser(user);
    setAddUserMode(false);
  };

  // Save edited user data
  const saveChanges = async () => {
    if (!selectedUser) return;

    const updateData = {
      firstname: editedData.firstname.trim() || selectedUser.firstname,
      lastname: editedData.lastname.trim() || selectedUser.lastname,
      email: editedData.email.trim() || selectedUser.email,
      affiliation_id: editedData.affiliation_id || selectedUser.affiliation_id,
      position_id: editedData.position_id || selectedUser.position_id,
      profile: editedData.profile || selectedUser.profile,
    };

    if (!updateData.firstname || !updateData.lastname || !updateData.email || 
        !updateData.affiliation_id || !updateData.position_id) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setSaveLoading(true);
      const token = localStorage.getItem('token') || '';
      
      const response = await fetch(`http://localhost:9898/api/superadmin/editUser/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const result = await response.json();
      alert('บันทึกข้อมูลเรียบร้อย');
      
      const updatedUser = {
        ...selectedUser,
        ...updateData,
        affiliation_name: getAffiliationNameById(updateData.affiliation_id),
        position_name: getPositionNameById(updateData.position_id),
      };
      
      setSelectedUser(updatedUser);
      setSearchResults(prev => 
        prev.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        )
      );
      setEditMode(false);
      
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const cancelEdit = () => {
    if (selectedUser) {
      setEditedData({
        firstname: selectedUser.firstname,
        lastname: selectedUser.lastname,
        email: selectedUser.email,
        affiliation_id: selectedUser.affiliation_id || '',
        position_id: selectedUser.position_id || '',
        profile: selectedUser.profile || DEFAULT_PROFILE_IMAGE,
      });
    }
    setEditMode(false);
  };

  // Add user functions
  const handleAddUser = () => {
    setAddUserMode(true);
    setSelectedUser(null);
    setEditMode(false);
    setNewUserData({
      profile: DEFAULT_PROFILE_IMAGE,
      username: '',
      password: '',
      prefix: '',
      firstname: '',
      lastname: '',
      email: '',
      gender: '',
      affiliation_id: '',
      position_id: '',
    });
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserData.username || !newUserData.password || !newUserData.prefix || 
          !newUserData.firstname || !newUserData.lastname || !newUserData.email || 
          !newUserData.gender || !newUserData.affiliation_id || !newUserData.position_id) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      setCreateUserLoading(true);
      const token = localStorage.getItem('token') || '';
      
      const response = await fetch('http://localhost:9898/api/superadmin/createUserAndAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUserData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      alert('สร้างผู้ใช้งานสำเร็จ');
      setAddUserMode(false);
      
      await fetchUsers();
      const statsResponse = await fetch('http://localhost:9898/api/superadmin/countusers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData);
      }
      
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const cancelAddUser = () => {
    setAddUserMode(false);
    if (searchResults.length > 0) {
      selectUser(searchResults[0]);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loading}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.error}>เกิดข้อผิดพลาด: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundLayer}></div>
      <div className={styles.container}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <h2>Super Admin</h2>

          <div className={styles.statsSection}>
            <div className={styles.statsTitle}>ข้อมูลจำนวนบัญชีผู้ใช้</div>
            <div className={styles.statItem}>
              <div className={`${styles.statDot} ${styles.active}`}></div>
              <span>บัญชีทั้งหมด</span>
              <span className={styles.statCount}>{userStats.total_users} คน</span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statDot} ${styles.inactive}`}></div>
              <span>บัญชีที่เปิดใช้งาน</span>
              <span className={styles.statCount}>{userStats.active_users} คน</span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statDot} ${styles.blocked}`}></div>
              <span>บัญชีที่ปิดใช้งาน</span>
              <span className={styles.statCount}>{userStats.inactive_users} คน</span>
            </div>
          </div>

          <input
            type="text"
            className={styles.searchBox}
            placeholder="ค้นหาด้วยชื่อ/นามสกุล/คำนำหน้า"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchLoading && <div className={styles.searchLoading}>กำลังค้นหา...</div>}

          <nav>
            <ul className={styles.menuList}>
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className={`${styles.menuItem} ${
                    selectedUser?.id === user.id ? styles.menuItemSelected : ''
                  }`}
                >
                  <a
                    href="#"
                    className={styles.menuLink}
                    onClick={(e) => {
                      e.preventDefault();
                      selectUser(user);
                    }}
                  >
                    {user.prefix} {user.firstname} {user.lastname}
                  </a>
                </li>
              ))}
              {searchTerm && !searchLoading && searchResults.length === 0 && (
                <li className={styles.noResults}>ไม่พบผู้ใช้งาน</li>
              )}
            </ul>
          </nav>

          <button className={styles.addUserBtn} onClick={handleAddUser}>
            <span>+</span>
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </div>

        {/* Main content */}
        <div className={styles.mainContent}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
            disabled={uploadingImage}
          />

          {addUserMode ? (
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
                  <label className={styles.formLabel}>เลขบัตรประชาชน *</label>
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
                  <label className={styles.formLabel}>รหัสผ่าน *</label>
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
                  <label className={styles.formLabel}>คำนำหน้า *</label>
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
                  <label className={styles.formLabel}>ชื่อ *</label>
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
                  <label className={styles.formLabel}>นามสกุล *</label>
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
                  <label className={styles.formLabel}>อีเมล *</label>
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
                  <label className={styles.formLabel}>เพศ *</label>
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
                  <label className={styles.formLabel}>สังกัดกอง *</label>
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
                  <label className={styles.formLabel}>ตำแหน่ง *</label>
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
          ) : selectedUser ? (
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
                  <input type="text" className={styles.formInput} value={selectedUser.username} disabled />
                </div>

                {/* Gender */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>เพศ</label>
                  <input type="text" className={styles.formInput} value={selectedUser.gender} disabled />
                </div>

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

                {/* Email */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>อีเมล</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    disabled={!editMode}
                    value={editedData.email}
                    onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
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
                      value={selectedUser.affiliation_name || 'ไม่มีข้อมูล'}
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
                      value={selectedUser.position_name || 'ไม่มีข้อมูล'}
                      disabled
                    />
                  )}
                </div>

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
                        onClick={saveChanges} 
                        disabled={saveLoading}
                        style={{ flex: 1 }}
                      >
                        {saveLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                      <button 
                        type="button" 
                        className={styles.cancelBtn} 
                        onClick={cancelEdit} 
                        disabled={saveLoading}
                        style={{ flex: 1 }}
                      >
                        ยกเลิก
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>กรุณาเลือกผู้ใช้จากฝั่งซ้าย</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;