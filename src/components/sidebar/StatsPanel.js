import React from 'react';

const StatsPanel = ({ wallet, stats }) => {
  const statItems = [
    {
      label: 'ETH余额',
      value: wallet.ethBalance || '0.00',
      icon: '💎'
    },
    {
      label: 'USDT余额',
      value: wallet.usdtBalance || '0.00',
      icon: '💰'
    },
    {
      label: '交易次数',
      value: stats.tx || 0,
      icon: '📊'
    },
    {
      label: '数据记录',
      value: stats.data || 0,
      icon: '📋'
    }
  ];

  return (
    <div className="glass rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <span className="mr-2">📊</span>实时统计
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-blue-600">
              {stat.value}
            </div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;