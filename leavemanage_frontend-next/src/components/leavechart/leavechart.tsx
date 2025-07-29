'use client'
import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
)

export default function LeaveChart() {
  const [data, setData] = useState<any>(null)
  const [options, setOptions] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }

      try {
        const res = await fetch('http://localhost:9898/api/dashboard/leaveBalance', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!res.ok) {
          return
        }

        const json = await res.json()

        const labels = json.map((item: any) => {
          if (item.name === 'ลาป่วย') return 'ลาป่วย'
          if (item.name === 'ลากิจส่วนตัว') return 'ลากิจส่วนตัว'
          if (item.name === 'ลาพักผ่อน') return 'ลาพักผ่อน'
          return item.name
        });
        
        const values = json.map((item: any) =>
          parseInt(item.used_days)
        )
        const max = Math.max(...json.map((item: any) => parseInt(item.total_days)))

        setData({
          labels: labels,
          datasets: [
            {
              // The main change: one dataset for all bars
              label: 'วันลาที่ใช้ไป', // A single label for the legend
              data: values, // All values in one data array
              backgroundColor: ['#FF3B30', '#5BC8FF', '#3DB558'] // Array of colors for each bar
            }
          ]
        })

        setOptions({
          responsive: true,
          maintainAspectRatio: false ,
          plugins: {
            legend: { 
                position: 'top',
                labels: {
                    generateLabels: function(chart: any) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map(function(label: string, i: number) {
                                let color = data.datasets[0].backgroundColor[i];
                                let textLabel = '';
                                if (label === 'ลาป่วย') textLabel = 'วันลาป่วย';
                                else if (label === 'ลากิจส่วนตัว') textLabel = 'วันลากิจส่วนตัว';
                                else if (label === 'ลาพักผ่อน') textLabel = 'วันลาพักผ่อน';
                                else textLabel = label;

                                return {
                                    text: textLabel,
                                    fillStyle: color,
                                    strokeStyle: color,
                                    lineWidth: 0,
                                    pointStyle: 'rect',
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            title: { display: true, text: 'สถิติวันลาที่ใช้ไปของคุณ' }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: Math.ceil(max / 10) * 10,
              ticks: { stepSize: 10 }
            }
          }
        })
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลลา', err)
      }
    }

    loadData()
  }, [])

  if (!data || !options) return <p>กำลังโหลดกราฟ...</p>

  return <Bar data={data} options={options} />
}