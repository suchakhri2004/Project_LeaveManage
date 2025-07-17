import React from 'react';
import styles from './confirmPopup.module.scss';

interface ConfirmPopupProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <p>{message}</p>
        <div className={styles.buttonGroup}>
          <button className={styles.confirm} onClick={onConfirm}>ยืนยัน</button>
          <button className={styles.cancel} onClick={onCancel}>ยกเลิก</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
