import React, { useState } from 'react';
import EthTransfer from './tabs/EthTransfer';
import TokenTransfer from './tabs/TokenTransfer';
import ContractStorage from './tabs/ContractStorage';
import DataQuery from './tabs/DataQuery';

const MainContent = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const [activeTab, setActiveTab] = useState('token-transfer');

  const tabs = [
    {
      id: 'token-transfer',
      name: '🪙 代币转账',
      component: TokenTransfer
    },
    {
      id: 'eth-transfer',
      name: '⚡ ETH转账',
      component: EthTransfer
    },
    {
      id: 'contract-storage',
      name: '📝 合约存储',
      component: ContractStorage
    },
    {
      id: 'data-query',
      name: '🔍 数据查询',
      component: DataQuery
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="flex-1 p-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg">
        {ActiveComponent && (
          <ActiveComponent
            showToast={showToast}
            showProgress={showProgress}
            updateProgress={updateProgress}
            hideProgress={hideProgress}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;