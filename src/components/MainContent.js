import React, { useState } from 'react';
import EthTransfer from './tabs/EthTransfer';
import TokenTransfer from './tabs/TokenTransfer';
import ContractStorage from './tabs/ContractStorage';
import DataQuery from './tabs/DataQuery';

const MainContent = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const [activeTab, setActiveTab] = useState('eth');

  const tabs = [
    { id: 'eth', label: '💰 ETH转账', desc: '携带数据转账' },
    { id: 'token', label: '🪙 代币转账', desc: '代币合约调用' },
    { id: 'contract', label: '📝 合约存储', desc: '事件日志存储' },
    { id: 'query', label: '🔍 数据查询', desc: '表格化展示' }
  ];

  const renderTabContent = () => {
    const commonProps = { showToast, showProgress, updateProgress, hideProgress };

    switch (activeTab) {
      case 'eth': return <EthTransfer {...commonProps} />;
      case 'token': return <TokenTransfer {...commonProps} />;
      case 'contract': return <ContractStorage {...commonProps} />;
      case 'query': return <DataQuery {...commonProps} />;
      default: return <EthTransfer {...commonProps} />;
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <span className="mr-3">🚀</span>
        数据上链操作中心
      </h2>

      <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all text-center ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform -translate-y-1'
                : 'text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <div className="font-semibold">{tab.label}</div>
            <div className="text-xs opacity-75">{tab.desc}</div>
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};

export default MainContent;