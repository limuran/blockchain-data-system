import React from 'react';
import WalletButton from './wallet/WalletButton';
import NetworkIndicator from './wallet/NetworkIndicator';

const Header = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  return (
    <div className="glass rounded-2xl p-6 mb-8 shadow-2xl">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center">
          <span className="text-3xl mr-3">⛓️</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              区块链数据上链系统
            </h1>
            <p className="text-sm text-gray-600">
              支持多链切换 | ENS展示 | 数据查询表格 | 任意字符串上链
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NetworkIndicator showToast={showToast} />
          <WalletButton 
            showToast={showToast}
            showProgress={showProgress}
            updateProgress={updateProgress}
            hideProgress={hideProgress}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;