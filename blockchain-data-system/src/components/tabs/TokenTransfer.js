import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { getNetworkByChainId } from '../../config/networks';
import { ethers } from 'ethers';

const TokenTransfer = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0.00');
  const [form, setForm] = useState({
    address: '',
    amount: '1.0',
    data: '订单编号:ORD' + Date.now() + ' 付款类型:服务费 Service payment for order'
  });

  const currentNetwork = getNetworkByChainId(wallet.chainId);
  const usdtToken = currentNetwork?.tokens?.USDT;

  const ERC20_ABI = [
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)'
  ];

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (wallet.address && usdtToken && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(usdtToken.address, ERC20_ABI, provider);
          const balance = await contract.balanceOf(wallet.address);
          const formatted = parseFloat(ethers.formatUnits(balance, usdtToken.decimals)).toFixed(2);
          setTokenBalance(formatted);
        } catch (e) {
          setTokenBalance('0.00');
        }
      }
    };

    fetchTokenBalance();
  }, [wallet.address, wallet.chainId, usdtToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!usdtToken) {
      showToast('当前网络不支持USDT', 'error');
      return;
    }

    setLoading(true);
    try {
      showProgress('代币转账 + 数据记录中...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(usdtToken.address, ERC20_ABI, signer);

      updateProgress(2);

      const amountWei = ethers.parseUnits(form.amount, usdtToken.decimals);
      const tx = await contract.transfer(form.address, amountWei);
      
      updateProgress(3);
      const receipt = await tx.wait();
      updateProgress(4);

      addRecord({
        type: '🪙 USDT转账',
        hash: tx.hash,
        amount: `${form.amount} USDT`,
        data: form.data,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      });

      setTimeout(() => {
        hideProgress();
        showToast('✅ USDT转账成功！', 'success');
      }, 500);
    } catch (error) {
      hideProgress();
      showToast('转账失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!usdtToken) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-yellow-800 mb-2">当前网络不支持USDT</h3>
        <p className="text-yellow-700">请切换到Sepolia测试网或以太坊主网</p>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">🪙</span>
        <div>
          <h3 className="text-lg font-bold text-purple-900">代币转账数据上链</h3>
          <p className="text-purple-700 text-sm">
            方式2: 通过USDT合约转账，关联任意字符串数据
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">📍 接收地址</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none font-mono text-sm"
            placeholder="0x..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">💰 转账金额 (USDT)</label>
          <input
            type="number"
            value={form.amount}
            step="0.01"
            min="0"
            onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">💳 当前余额: {tokenBalance} USDT</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">📄 关联数据（任意字符串）</label>
          <textarea
            value={form.data}
            rows="3"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none resize-none text-sm"
            placeholder="输入任意数据，支持中文、英文、数字等..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !wallet.address}
          className={`w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-lg font-semibold transition-all ${
            loading || !wallet.address
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {loading ? '转账中...' : '💸 发送USDT转账'}
        </button>
      </form>
    </div>
  );
};

export default TokenTransfer;