import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { ethers } from 'ethers';

const EthTransfer = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    address: '',
    amount: '0.001',
    data: '你好世界！这是一条中文测试数据。Hello World! This is test data.'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!ethers.isAddress(form.address)) {
      showToast('请输入有效的以太坊地址', 'error');
      return;
    }

    if (!form.data.trim()) {
      showToast('请输入要上链的数据', 'error');
      return;
    }

    setLoading(true);
    try {
      showProgress('ETH转账 + 数据上链中...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountWei = ethers.parseEther(form.amount);
      const encodedData = ethers.hexlify(ethers.toUtf8Bytes(form.data));

      updateProgress(2);

      const balance = await provider.getBalance(wallet.address);
      const gasEstimate = await provider.estimateGas({
        to: form.address,
        value: amountWei,
        data: encodedData
      });
      const gasCost = gasEstimate * (await provider.getFeeData()).gasPrice;
      
      if (balance < amountWei + gasCost) {
        throw new Error('ETH余额不足，请确保有足够的Gas费用');
      }

      updateProgress(3);

      const tx = await signer.sendTransaction({
        to: form.address,
        value: amountWei,
        data: encodedData,
        gasLimit: gasEstimate * 120n / 100n
      });

      const receipt = await tx.wait();
      updateProgress(4);

      addRecord({
        type: '💰 ETH转账',
        hash: tx.hash,
        amount: `${form.amount} ETH`,
        data: form.data,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      });

      setTimeout(() => {
        hideProgress();
        showToast('✅ ETH转账成功！', 'success');
      }, 500);

      setForm(prev => ({ ...prev, data: '你好世界！这是一条中文测试数据。Hello World! This is test data.' }));
    } catch (error) {
      hideProgress();
      showToast('转账失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">💰</span>
        <div>
          <h3 className="text-lg font-bold text-blue-900">ETH转账数据上链</h3>
          <p className="text-blue-700 text-sm">
            方式1: 在交易data字段嵌入任意字符串（支持中英文）
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
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm"
            placeholder="0x... 或 ENS域名"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">💎 金额 (ETH)</label>
          <input
            type="number"
            value={form.amount}
            step="0.0001"
            min="0"
            onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">💡 支持18位精度，可以0个以太币</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">📄 上链数据（任意字符串）</label>
          <textarea
            value={form.data}
            rows="4"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none text-sm"
            placeholder="输入任意数据，支持中文、英文、数字等..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            ℹ️ 数据将编码到交易data字段，永久存储在区块链上
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !wallet.address}
          className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold transition-all ${
            loading || !wallet.address
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-xl hover:-translate-y-2'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              处理中...
            </div>
          ) : (
            <>🚀 发送ETH转账上链</>
          )}
        </button>
      </form>

      <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">🎡 优势特点</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 💰 支持18位精度，可以0ETH转账</p>
          <p>• 🌍 支持中英文任意字符串数据</p>
          <p>• 🔍 数据永久存储，可通过交易查询</p>
          <p>• ⚡ Gas优化，最低21000 gas</p>
        </div>
      </div>
    </div>
  );
};

export default EthTransfer;