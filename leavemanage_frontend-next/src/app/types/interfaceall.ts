export default interface User {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    gender: string;
    email: string;
    profile: string;
    signature: string;
    position_id: string;
    position: string;
    affiliation_name: string;
    role: string
  };


export interface AffiliationOption {
  id: string;
  name: string;
}

export interface PositionOption {
  id: string;
  positionname: string;
}


export const genderOptions = [
  { value: '', label: 'เลือกเพศ' },
  { value: 'ชาย', label: 'ชาย' },
  { value: 'หญิง', label: 'หญิง' },
];

export const prefixOptions = [
  { value: '', label: 'เลือกคำนำหน้า' },
  { value: 'นาย', label: 'นาย' },
  { value: 'นางสาว', label: 'นางสาว' },
  { value: 'นาง', label: 'นาง' },
];

export const CLOUDINARY_CLOUD_NAME = 'dkilzjefh';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
export const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
export const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';