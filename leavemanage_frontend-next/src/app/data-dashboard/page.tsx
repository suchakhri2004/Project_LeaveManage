'use client';

import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import Select from 'react-select';
import styles from './data-dashboard.module.scss';
import Navbar from '../../components/navbar/Navbar';

interface ReplacementItem {
  id: string;
  name: string;
}

const LeaveStatisticsPage = () => {
  const [replacementList, setReplacementList] = useState<ReplacementItem[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const token = localStorage.getItem('token');
  const chartRefs = useRef<Record<string, Chart | null>>({});

  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const fixedLabels = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลาพักผ่อน'];
  const colorMap: Record<string, string> = {
    'ลาป่วย': '#FF6B6B',
    'ลากิจส่วนตัว': '#4ECDC4',
    'ลาพักผ่อน': '#45B7D1',
  };

  const replacementOptions = replacementList.map(rep => ({
    value: rep.id,
    label: rep.name
  }));

  const monthOptions = thaiMonthNames.map((name, index) => ({
    value: index + 1,
    label: name,
  }));

  const destroyChartIfExists = (id: string) => {
    if (chartRefs.current[id]) {
      chartRefs.current[id]!.destroy();
      chartRefs.current[id] = null;
    }
  };

  const fetchAndRenderChart = async (
    id: string,
    url: string,
    valueKey: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ) => {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();

      let leaveStats: any[] = [];
      if (Array.isArray(data)) leaveStats = data;
      else if (Array.isArray(data.leaveBalances)) leaveStats = data.leaveBalances;
      else if (Array.isArray(data.leaveStats)) leaveStats = data.leaveStats;

      const dataMap = leaveStats.reduce((acc: Record<string, number>, item) => {
        const name = item.leave_type_name || item.leave_type || '';
        const value = parseFloat(item[valueKey]) || 0;
        acc[name] = value;
        return acc;
      }, {});

      const values = fixedLabels.map(label => dataMap[label] || 0);
      const backgroundColors = fixedLabels.map(label => colorMap[label]);

      const total = values.reduce((sum, v) => sum + v, 0);
      const ctx = document.getElementById(id) as HTMLCanvasElement;
      if (!ctx) return;

      destroyChartIfExists(id);

      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: total > 0 ? fixedLabels : ['ไม่มีการลา'],
          datasets: [{
            data: total > 0 ? values : [1],
            backgroundColor: total > 0 ? backgroundColors : ['#CCCCCC'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
        },
      });

      chartRefs.current[id] = chart;
    } catch (err) {
      console.error(`Error rendering chart ${id}:`, err);
    }
  };

  useEffect(() => {
    const fetchReplacementList = async () => {
      try {
        const res = await fetch('http://localhost:9898/api/form/getAllUsers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReplacementList(data);
        if (data.length > 0) {
          setUserId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReplacementList();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAndRenderChart('personalChart', `http://localhost:9898/api/dashboard/individual/${userId}`, 'used_days');
    }
  }, [userId]);

  useEffect(() => {
    fetchAndRenderChart('weeklyChart', `http://localhost:9898/api/dashboard/weekly`, 'days_in_week');
    fetchAndRenderChart('yearChart', `http://localhost:9898/api/dashboard/yearly`, 'days_in_year');
  }, []);

  useEffect(() => {
    fetchAndRenderChart(
      'monthChart',
      `http://localhost:9898/api/dashboard/monthly`,
      'days_in_month',
      'POST',
      { month: selectedMonth }
    );
  }, [selectedMonth]);

  return (
    <div className={styles['request-leave-page']}>
    <Navbar/>
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>สถิติการลา</div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.legend}>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.sick}`} />ลาป่วย</div>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.personal}`} />ลากิจส่วนตัว</div>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.vacation}`} />ลาพักผ่อน</div>
          <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.nodata}`} />ไม่มีการลา</div>
        </div>

        <div className={styles.chartsContainer}>
          <div className={styles.chartWrapper}>
            <Select
              id="replacement"
              options={replacementOptions}
              placeholder="-- กรุณาเลือกพนักงาน --"
              isSearchable
              value={replacementOptions.find(opt => opt.value === userId)}
              onChange={(selectedOption) => setUserId(selectedOption?.value || '')}
              className={styles['react-select-container']}
              classNamePrefix="react-select"
            />
            <div className={styles.chartTitle}>รายบุคคล</div>
            <div className={styles.chartContainer}><canvas id="personalChart" /></div>
          </div>

          <div className={styles.chartWrapper}>
            <div className={styles.chartTitle}>สัปดาห์นี้</div>
            <div className={styles.chartContainer}><canvas id="weeklyChart" /></div>
          </div>

          <div className={styles.chartWrapper}>
            <Select
              id="monthSelect"
              options={monthOptions}
              placeholder="-- เลือกเดือน --"
              value={monthOptions.find(opt => opt.value === selectedMonth)}
              onChange={(selectedOption) => setSelectedMonth(selectedOption?.value || 1)}
              className={styles['react-select-container']}
              classNamePrefix="react-select"
            />
            <div className={styles.chartTitle}>รายเดือน</div>
            <div className={styles.chartContainer}><canvas id="monthChart" /></div>
          </div>

          <div className={styles.chartWrapper}>
            <div className={styles.chartTitle}>รายปี</div>
            <div className={styles.chartContainer}><canvas id="yearChart" /></div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LeaveStatisticsPage;
