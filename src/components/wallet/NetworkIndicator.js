import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { NETWORKS, getSupportedNetworks } from '../../config/networks';
import { ChevronDown } from 'lucide-react';

const NetworkIndicator = ({ showToast }) => {
  const { wallet, switchNetwork } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const currentNetwork = Object.values(NETWORKS).find(n => n.chainId === wallet.chainId);
  const supportedNetworks = getSupportedNetworks();

  const handleNetworkSwitch = async (targetChainId) => {
    if (targetChainId === wallet.chainId) {
      setIsDropdownOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const success = await switchNetwork(targetChainId);
      if (success) {
        setIsDropdownOpen(false);
        const networkName = Object.values(NETWORKS).find(n => n.chainId === targetChainId)?.name;
        showToast(`✅ 已切换到${networkName}`, 'success');
      } else {
        showToast('网络切换失败', 'error');
      }
    } catch (error) {
      showToast('网络切换失败: ' + error.message, 'error');
    } finally {
      setSwitching(false);
    }
  };

  const getNetworkStatusColor = () => {
    if (!currentNetwork) return 'bg-red-100 text-red-700';
    if (currentNetwork.chainId === 11155111) return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getNetworkStatusIcon = () => {
    if (!currentNetwork) return '❌';
    if (switching) return '🔄';
    return '🌐';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all ${
          getNetworkStatusColor()
        } hover:shadow-lg`}
        disabled={switching}
      >
        <span className="mr-2">{getNetworkStatusIcon()}</span>
        <span>{wallet.chainName || '未连接'}</span>
        <ChevronDown className="ml-1 w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 text-sm font-medium text-gray-500 border-b">
            选择网络
          </div>
          {supportedNetworks.map((network) => (
            <button
              key={network.chainId}
              onClick={() => handleNetworkSwitch(network.chainId)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                wallet.chainId === network.chainId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              disabled={switching}
            >
              <div>
                <div className="font-medium">{network.name}</div>
                <div className="text-xs text-gray-500">Chain ID: {network.chainId}</div>
              </div>
              {wallet.chainId === network.chainId && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkIndicator;