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

  const isSelfTransfer = () => {
    return wallet.address && form.address && 
           wallet.address.toLowerCase() === form.address.toLowerCase();
  };

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

    // 检查是否为自转账
    if (isSelfTransfer()) {
      showToast('⚠️ 注意：向自己转账时某些网络可能不支持附加数据。如果失败，请尝试转账到其他地址。', 'warning');
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
      let txParams = {
        to: form.address,
        value: amountWei
      };

      // 如果不是自转账，或者用户坚持要尝试，则添加data
      if (!isSelfTransfer()) {
        txParams.data = encodedData;
      } else {
        // 自转账时，先尝试不带data的简单转账
        showProgress('检测到自转账，尝试简单转账模式...');
        // 可以选择是否包含data
        if (form.data.trim()) {
          // 给用户选择：是否强制尝试带data的自转账
          const userChoice = window.confirm(
            '检测到您在向自己转账。\\n\\n' +
            '某些网络不支持向自己转账时附加数据。\\n\\n' +
            '点击"确定"尝试带数据转账（可能失败）\\n' +
            '点击"取消"使用简单转账（无数据）'
          );
          
          if (userChoice) {
            txParams.data = encodedData;
            showProgress('尝试带数据的自转账...');
          } else {
            showProgress('使用简单自转账模式...');
            showToast('💡 已切换到简单转账模式，数据将不会上链', 'info');
          }
        }
      }

      // 估算Gas费用
      let gasLimit;
      try {
        const gasEstimate = await provider.estimateGas(txParams);
        gasLimit = gasEstimate + (gasEstimate * 20n / 100n); // 增加20%缓冲
      } catch (gasError) {
        console.warn('Gas估算失败:', gasError);
        // 如果是自转账带data导致的估算失败，尝试简单转账
        if (isSelfTransfer() && txParams.data) {
          showToast('带数据的自转账Gas估算失败，正在尝试简单转账...', 'warning');
          delete txParams.data;
          try {
            const simpleGasEstimate = await provider.estimateGas(txParams);
            gasLimit = simpleGasEstimate + (simpleGasEstimate * 20n / 100n);
            showToast('已自动切换到简单转账模式', 'info');
          } catch (simpleGasError) {
            gasLimit = 21000n; // 最基本的ETH转账gas
          }
        } else {
          gasLimit = txParams.data ? 100000n : 21000n;
        }
      }

      txParams.gasLimit = gasLimit;

      // 发送交易
      showProgress('发送交易...');
      updateProgress(4);

      const tx = await signer.sendTransaction(txParams);

      showProgress('等待交易确认...');
      updateProgress(5);

      const receipt = await tx.wait();

      addRecord({
        type: txParams.data ? '🔗 ETH数据上链' : '💰 ETH转账',
        hash: tx.hash,
        amount: `${form.amount} ETH`,
        data: txParams.data ? form.data : '简单ETH转账（无数据）',
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        extra: isSelfTransfer() ? '自转账' : `转账到 ${form.address.slice(0, 6)}...${form.address.slice(-4)}`
      });

      setTimeout(() => {
        hideProgress();
        const successMessage = txParams.data ? '✅ ETH转账 + 数据上链成功！' : '✅ ETH转账成功！';
        showToast(successMessage, 'success');
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
        errorMessage = '当前网络不支持向该地址发送带数据的转账。建议：\\n1. 使用不同的接收地址\\n2. 或选择简单转账模式';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"bg-blue-50 border border-blue-200 rounded-xl p-6\">
      <div className=\"flex items-center mb-6\">
        <span className=\"text-2xl mr-3\">💰</span>
        <div>
          <h3 className=\"text-lg font-bold text-blue-900\">ETH转账数据上链</h3>
          <p className=\"text-blue-700 text-sm\">
            方式1: 在交易data字段嵌入任意字符串（支持中英文）
          </p>
        </div>
      </div>

      {/* 余额显示 */}
      <div className=\"mb-6 p-4 bg-white rounded-lg border\">
        <h4 className=\"font-medium mb-2\">💳 ETH余额</h4>
        <div className=\"text-lg font-bold text-blue-600\">{ethBalance} ETH</div>
      </div>

      <form onSubmit={handleSubmit} className=\"space-y-6\">
        {/* 接收地址 */}
        <div>
          <label className=\"block text-sm font-medium mb-2\">📍 接收地址</label>
          <input
            type=\"text\"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className=\"w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm\"
            placeholder=\"0x... 或 ENS域名\"
            required
            disabled={loading}
          />
          {/* 自转账警告 */}
          {isSelfTransfer() && (
            <div className=\"mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800\">
              ⚠️ 检测到自转账：某些网络可能不支持向自己转账时附加数据
            </div>
          )}
        </div>

        {/* 转账金额 */}
        <div>
          <label className=\"block text-sm font-medium mb-2\">💎 金额 (ETH)</label>
          <div className=\"relative\">
            <input
              type=\"number\"
              value={form.amount}
              step=\"0.0001\"
              min=\"0\"
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className=\"w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none\"
              required
              disabled={loading}
            />
            <button
              type=\"button\"
              onClick={() => {
                const maxAmount = Math.max(0, parseFloat(ethBalance) - 0.01); // 预留Gas费
                setForm(prev => ({ ...prev, amount: maxAmount.toFixed(6) }));
              }}
              className=\"absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors\"
              disabled={loading}
            >
              最大
            </button>
          </div>
          <p className=\"text-xs text-gray-500 mt-1\">💡 支持18位精度，可以0个以太币</p>
        </div>

        {/* 数据输入 */}
        <div>
          <label className=\"block text-sm font-medium mb-2\">📄 上链数据（任意字符串）</label>
          <textarea
            value={form.data}
            rows=\"4\"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className=\"w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none text-sm\"
            placeholder=\"输入任意数据，支持中文、英文、数字等...\"
            required
            disabled={loading}
          />
          <p className=\"text-xs text-gray-500 mt-1\">
            ℹ️ 数据将编码到交易data字段，永久存储在区块链上
          </p>
        </div>

        {/* 提交按钮 */}
        <button
          type=\"submit\"
          disabled={loading || !wallet.address}
          className={`w-full py-4 px-6 rounded-lg font-semibold transition-all ${
            loading || !wallet.address
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <div className=\"flex items-center justify-center space-x-2\">
              <div className=\"animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full\"></div>
              <span>处理中...</span>
            </div>
          ) : (
            '🚀 发送ETH转账上链'
          )}
        </button>
      </form>

      {/* 功能说明 */}
      <div className=\"mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg\">
        <h4 className=\"font-semibold text-blue-900 mb-2\">🎡 优势特点</h4>
        <div className=\"text-sm text-blue-800 space-y-1\">
          <p>• 💰 支持18位精度，可以0ETH转账</p>
          <p>• 🌍 支持中英文任意字符串数据</p>
          <p>• 🔍 数据永久存储，可通过交易查询</p>
          <p>• ⚡ Gas优化，智能估算</p>
          <p>• 🧪 测试网完全支持</p>
          <p>• ⚠️ 注意：自转账时某些网络可能限制数据附加</p>
        </div>
      </div>
    </div>
  );
};

export default EthTransfer;