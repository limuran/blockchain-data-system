import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

const WalletButton = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet, isConnecting, connectWallet, disconnectWallet } = useWallet();

  const handleConnect = async () => {
    try {
      showProgress('连接钱包中...');
      updateProgress(1);
      
      const success = await connectWallet();
      
      updateProgress(4);
      setTimeout(() => {
        hideProgress();
        if (success) {
          const msg = wallet.ensName ? `✅ 欢迎回来，${wallet.ensName}！` : '✅ 钱包连接成功！';
          showToast(msg, 'success');
        }
      }, 500);
    } catch (error) {
      hideProgress();
      showToast('连接失败: ' + error.message, 'error');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    showToast('钱包已断开', 'success');
  };

  if (!wallet.address) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all ${
          isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'
        }`}
      >
        {isConnecting ? '🔄 连接中...' : '👛 连接钱包'}
      </button>
    );
  }

  const displayName = wallet.ensName || 
    `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 bg-white bg-opacity-20 rounded-xl px-4 py-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
          {wallet.ensAvatar ? (
            <img
              src={wallet.ensAvatar}
              alt="ENS Avatar"
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-full h-full flex items-center justify-center ${wallet.ensAvatar ? 'hidden' : ''}`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <div className="font-semibold text-white flex items-center">
            {displayName}
            {wallet.ensName && (
              <span className="ml-1 text-xs bg-blue-400 px-2 py-0.5 rounded-full">
                .eth
              </span>
            )}
          </div>
          <div className="text-xs text-blue-100">
            {wallet.ethBalance} ETH | {wallet.usdtBalance} USDT
          </div>
        </div>
      </div>
      <button
        onClick={handleDisconnect}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        断开
      </button>
    </div>
  );
};

export default WalletButton;