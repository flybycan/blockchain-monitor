import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { BlockchainService } from '../services/BlockchainService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const BlockchainDashboard = () => {
  const [solanaStatus, setSolanaStatus] = useState({
    blockHeight: 0,
    currentSlot: 0,
    storageUsage: 0,
    transactionCount: 0,
    status: '未连接',
    networkHealth: '正常',
    avgBlockTime: 0,
    validatorCount: 400, // 示例数据
    tps: 0,
    currentTime: new Date().toLocaleString(),
    lastUpdateTime: ''
  });
  const [transactionHistory, setTransactionHistory] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const [tpsHistory, setTpsHistory] = useState<number[]>([]);

  const blockchainService = new BlockchainService();

  const updateData = async () => {
    try {
      const status = await blockchainService.getSolanaStatus();
      const currentTps = status.transactionCount ? status.transactionCount / 10 : 0; // 简单计算TPS
      
      setSolanaStatus({
        blockHeight: status.blockHeight || 0,
        currentSlot: status.currentSlot || 0,
        storageUsage: status.storageUsage || 0,
        transactionCount: status.transactionCount || 0,
        status: status.status === 'connected' ? '已连接' : '未连接',
        networkHealth: status.status === 'connected' ? '正常' : '异常',
        avgBlockTime: 0.4, // 示例数据
        validatorCount: 400,
        tps: currentTps,
        currentTime: new Date().toLocaleString(),
        lastUpdateTime: new Date().toLocaleString()
      });

      const currentTime = new Date().toLocaleTimeString();
      setTransactionHistory(prev => [...prev, status.transactionCount || 0].slice(-10));
      setTimeLabels(prev => [...prev, currentTime].slice(-10));
      setTpsHistory(prev => [...prev, currentTps].slice(-10));
    } catch (error) {
      console.error('更新数据失败:', error);
    }
  };

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Solana 交易数量',
        data: transactionHistory,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgb(75, 192, 192)',
        pointHoverBackgroundColor: 'rgb(75, 192, 192)',
        pointHoverBorderColor: '#fff'
      },
      {
        label: 'TPS',
        data: tpsHistory,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgb(255, 159, 64)',
        pointHoverBackgroundColor: 'rgb(255, 159, 64)',
        pointHoverBorderColor: '#fff'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          padding: 20,
          font: {
            size: 14,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3d3d3d',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#b3b3b3',
          padding: 10,
          font: {
            size: 12
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#b3b3b3',
          padding: 10,
          font: {
            size: 12
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const
    }
  };

  const getStatusColor = (status: string) => {
    return status === '已连接' ? '#4CAF50' : '#f44336';
  };

  const getHealthColor = (health: string) => {
    return health === '正常' ? '#4CAF50' : '#f44336';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Solana 区块链监控</h1>
        <div className="time-info">
          <span>当前时间：{solanaStatus.currentTime}</span>
          <span>上次更新：{solanaStatus.lastUpdateTime}</span>
        </div>
      </div>
      
      <div className="network-status">
        <div className="status-card">
          <h3>网络状态</h3>
          <p>
            <span>连接状态</span>
            <span style={{ color: getStatusColor(solanaStatus.status) }}>
              {solanaStatus.status}
            </span>
          </p>
          <p>
            <span>网络健康度</span>
            <span style={{ color: getHealthColor(solanaStatus.networkHealth) }}>
              {solanaStatus.networkHealth}
            </span>
          </p>
          <p>
            <span>当前TPS</span>
            <span>{solanaStatus.tps.toFixed(2)}</span>
          </p>
        </div>

        <div className="status-card">
          <h3>区块信息</h3>
          <p>
            <span>区块高度</span>
            <span>{solanaStatus.blockHeight.toLocaleString()}</span>
          </p>
          <p>
            <span>当前时隙</span>
            <span>{solanaStatus.currentSlot.toLocaleString()}</span>
          </p>
          <p>
            <span>平均出块时间</span>
            <span>{solanaStatus.avgBlockTime.toFixed(2)}s</span>
          </p>
        </div>

        <div className="status-card">
          <h3>网络指标</h3>
          <p>
            <span>验证节点数</span>
            <span>{solanaStatus.validatorCount.toLocaleString()}</span>
          </p>
          <p>
            <span>存储使用</span>
            <span>{solanaStatus.storageUsage.toFixed(2)} GB</span>
          </p>
          <p>
            <span>总交易数</span>
            <span>{solanaStatus.transactionCount.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="chart-container">
        <h2>网络性能趋势</h2>
        <div className="chart-wrapper">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};