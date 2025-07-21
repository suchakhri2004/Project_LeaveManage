"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GlobalLoading = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // สร้าง custom router wrapper
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;

    // Override push method
    router.push = (...args: any[]) => {
      setLoading(true);
      return originalPush.apply(router, args);
    };

    // Override replace method
    router.replace = (...args: any[]) => {
      setLoading(true);
      return originalReplace.apply(router, args);
    };

    // Override back method
    router.back = () => {
      setLoading(true);
      return originalBack.apply(router);
    };

    // Override forward method
    router.forward = () => {
      setLoading(true);
      return originalForward.apply(router);
    };

    // Listen for route changes
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // เพิ่ม event listeners สำหรับ browser navigation
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('popstate', handleStart);

    // ใช้ timeout เพื่อหยุด loading หลังจากที่ route เปลี่ยนแล้ว
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, 2000); // หยุด loading หลัง 2 วินาที
    }

    return () => {
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.forward = originalForward;

      // Remove event listeners
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('popstate', handleStart);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router, loading]);

  // ซ่อน loading เมื่อ component unmount
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}>
      <div style={{
        width: "50px",
        height: "50px",
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #3498db",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoading;