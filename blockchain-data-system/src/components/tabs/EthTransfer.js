import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { ethers } from 'ethers';

const EthTransfer = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [ethBalance, setEthBalance] = useState('0.000000');
  const [form, setForm] = useState({
    address: '',
    amount: '0.001',
    data: '你好世界！这是一条中文测试数据。Hello World! This is test data.'
  });

  // 获取ETH余额
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.address && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(wallet.address);
          setEthBalance(parseFloat(ethers.formatEther(balance)).toFixed(6));
        } catch (error) {
          console.error('获取ETH余额失败:', error);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [wallet.address]);

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

      // 检查余额
      const balance = await provider.getBalance(wallet.address);
      if (balance < amountWei) {
        throw new Error('ETH余额不足');
      }

      updateProgress(3);

      // 构建交易参数
      const txParams = {
        to: form.address,
        value: amountWei,
        data: encodedData
      };

      // 重要：大幅增加Gas限制来解决问题
      let gasLimit;
      try {
        // 先尝试估算Gas
        const gasEstimate = await provider.estimateGas(txParams);
        // 增加更大的缓冲（50%而不是20%）
        gasLimit = gasEstimate + (gasEstimate * 50n / 100n);
        console.log('估算Gas:', gasEstimate.toString(), '实际使用:', gasLimit.toString());
      } catch (gasError) {
        console.warn('Gas估算失败，使用更大的默认值:', gasError);
        // 使用更大的默认值：带data的转账需要更多gas
        const dataLength = encodedData.length;
        const baseGas = 21000n; // 基础ETH转账
        const dataGas = BigInt(dataLength) * 16n; // 每字茂16 gas（非零字节）
        gasLimit = baseGas + dataGas + 50000n; // 额外缓冲50000 gas
        console.log('使用默认Gas限制:', gasLimit.toString());
      }

      // 确保Gas限制不会太低
      const minGasLimit = 100000n; // 最低10万gas
      if (gasLimit < minGasLimit) {
        gasLimit = minGasLimit;
        console.log('使用最低Gas限制:', gasLimit.toString());
      }

      txParams.gasLimit = gasLimit;

      // 发送交易
      showProgress('发送交易...');
      updateProgress(4);

      console.log('发送交易参数:', {
        to: txParams.to,
        value: txParams.value.toString(),
        dataLength: encodedData.length,
        gasLimit: txParams.gasLimit.toString()
      });

      const tx = await signer.sendTransaction(txParams);

      showProgress('等待交易确认...');
      updateProgress(5);

      const receipt = await tx.wait();

      addRecord({
        type: '🔗 ETH数据上链',
        hash: tx.hash,
        amount: `${form.amount} ETH`,
        data: form.data,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        extra: `数据长度: ${form.data.length} 字符，Gas使用: ${receipt.gasUsed.toString()}`
      });

      setTimeout(() => {
        hideProgress();
        showToast('✅ ETH转账 + 数据上链成功！', 'success');
        // 重置地址，保留其他字段便于继续测试
        setForm(prev => ({ 
          ...prev, 
          address: ''
        }));
        
        // 刷新余额
        setTimeout(async () => {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(wallet.address);
            setEthBalance(parseFloat(ethers.formatEther(balance)).toFixed(6));
          } catch (error) {
            console.error('刷新余额失败:', error);
          }
        }, 2000);
      }, 500);

    } catch (error) {
      hideProgress();
      console.error('ETH转账失败:', error);
      
      let errorMessage = '转账失败: ' + error.message;
      if (error.message.includes('user rejected')) {
        errorMessage = '用户取消了交易';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'ETH余额不足或Gas费不够';
      } else if (error.message.includes('cannot include data')) {
        errorMessage = '网络不支持带数据的转账到该地址类型';
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas费设置问题，请重试';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">💰</span>
        <div>
          <h3 className="text-lg font-bold text-blue-900">ETH转账数据上链</h3>
          <p className="text-blue-700 text-sm">
            方式1: 在交易data字段嵌入任意字符串（支持中英文）
          </p>
        </div>
      </div>

      {/* 余额显示 */}
      <div className="mb-6 p-4 bg-white rounded-lg border">
        <h4 className="font-medium mb-2">💳 ETH余额</h4>
        <div className="text-lg font-bold text-blue-600">{ethBalance} ETH</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 接收地址 */}
        <div>
          <label className="block text-sm font-medium mb-2">📍 接收地址</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm"
            placeholder="0x... 或 ENS域名"
            required
            disabled={loading}
          />
        </div>

        {/* 转账金额 */}
        <div>
          <label className="block text-sm font-medium mb-2">💎 金额 (ETH)</label>
          <div className="relative">
            <input
              type="number"
              value={form.amount}
              step="0.0001"
              min="0"
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => {
                const maxAmount = Math.max(0, parseFloat(ethBalance) - 0.01);
                setForm(prev => ({ ...prev, amount: maxAmount.toFixed(6) }));
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
              disabled={loading}
            >
              最大
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">💡 支持18位精度，可以0个以太币</p>
        </div>

        {/* 数据输入 */}
        <div>
          <label className="block text-sm font-medium mb-2">📄 上链数据（任意字符串）</label>
          <textarea
            value={form.data}
            rows="4"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none text-sm"
            placeholder="输入任意数据，支持中文、英文、数字等..."
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            ℹ️ 数据将编码到交易data字段，永久存储在区块链上
          </p>
          <p className="text-xs text-blue-600 mt-1">
            当前数据长度: {form.data.length} 字符 = {ethers.hexlify(ethers.toUtf8Bytes(form.data)).length - 2} 字节
          </p>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading || !wallet.address}
          className={`w-full py-4 px-6 rounded-lg font-semibold transition-all ${
            loading || !wallet.address
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>处理中...</span>
            </div>
          ) : (
            '🚀 发送ETH转账上链'
          )}
        </button>
      </form>

      {/* 功能说明 */}
      <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">🎡 优势特点</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 💰 支持18位精度，可以0ETH转账</p>
          <p>• 🌍 支持中英文任意字符串数据</p>
          <p>• 🔍 数据永久存储，可通过交易查询</p>
          <p>• ⚡ 智能Gas估算，自动优化</p>
          <p>• 🧪 测试网完全支持</p>
          <p>• 🔧 已修复：增加足够的Gas限制</p>
        </div>
      </div>
    </div>
  );
};

export default EthTransfer;