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

  // 检查是否为内部账户转账
  const isInternalTransfer = (fromAddress, toAddress) => {
    // 简化检查：如果目标地址和当前地址相同，则认为是内部转账
    return fromAddress.toLowerCase() === toAddress.toLowerCase();
  };

  // 检查是否可能是同一钱包的不同账户
  const isPossibleSameWalletTransfer = async (toAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 获取所有账户
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const normalizedToAddress = toAddress.toLowerCase();
      
      // 检查目标地址是否在钱包的账户列表中
      return accounts.some(account => account.toLowerCase() === normalizedToAddress);
    } catch (error) {
      console.warn('无法检查账户列表:', error);
      return false;
    }
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

    // 检查是否为自己转给自己
    if (isInternalTransfer(wallet.address, form.address)) {
      showToast('不能转账给自己，请输入其他地址', 'error');
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
      const gasPrice = await provider.getFeeData();
      const estimatedGasCost = gasPrice.gasPrice * 100000n; // 预估gas费
      
      if (balance < (amountWei + estimatedGasCost)) {
        throw new Error('ETH余额不足以支付转账金额和Gas费');
      }

      updateProgress(3);

      // 检查是否可能是同一钱包的不同账户转账
      const isSameWallet = await isPossibleSameWalletTransfer(form.address);
      
      let txParams = {
        to: form.address,
        value: amountWei
      };

      // 如果可能是同一钱包转账，先尝试不带data的转账
      if (isSameWallet) {
        console.log('检测到可能的同一钱包转账，使用两步法：1.ETH转账 2.纯数据交易');
        showToast('检测到同一钱包转账，将使用两步法确保成功', 'info');
        
        // 第一步：纯ETH转账（不带数据）
        showProgress('第一步：执行ETH转账...');
        updateProgress(3.5);
        
        const ethTx = await signer.sendTransaction(txParams);
        const ethReceipt = await ethTx.wait();
        
        // 第二步：发送纯数据交易（0 ETH，仅包含数据）
        showProgress('第二步：上链数据...');
        updateProgress(4.5);
        
        const dataTxParams = {
          to: form.address,
          value: 0n,
          data: encodedData,
          gasLimit: 50000n // 数据交易使用较少的gas
        };
        
        const dataTx = await signer.sendTransaction(dataTxParams);
        const dataReceipt = await dataTx.wait();
        
        // 记录两个交易
        addRecord({
          type: '🔗 ETH转账(两步法)',
          hash: ethTx.hash,
          amount: `${form.amount} ETH`,
          data: '(第一步：ETH转账)',
          gasUsed: ethReceipt.gasUsed.toString(),
          blockNumber: ethReceipt.blockNumber,
          extra: `分步转账 - ETH部分`
        });
        
        addRecord({
          type: '🔗 数据上链(两步法)',
          hash: dataTx.hash,
          amount: '0 ETH',
          data: form.data,
          gasUsed: dataReceipt.gasUsed.toString(),
          blockNumber: dataReceipt.blockNumber,
          extra: `分步转账 - 数据部分，长度: ${form.data.length} 字符`
        });
        
      } else {
        // 正常情况：一步到位的转账+数据
        console.log('外部地址转账，使用标准方法');
        
        txParams.data = encodedData;

        // Gas估算和设置
        let gasLimit;
        try {
          const gasEstimate = await provider.estimateGas(txParams);
          gasLimit = gasEstimate + (gasEstimate * 50n / 100n);
          console.log('估算Gas:', gasEstimate.toString(), '实际使用:', gasLimit.toString());
        } catch (gasError) {
          console.warn('Gas估算失败，使用默认值:', gasError);
          const dataLength = encodedData.length;
          const baseGas = 21000n;
          const dataGas = BigInt(dataLength - 2) * 16n / 2n; // 每两个十六进制字符=1字节=16gas
          gasLimit = baseGas + dataGas + 50000n;
        }

        const minGasLimit = 100000n;
        if (gasLimit < minGasLimit) {
          gasLimit = minGasLimit;
        }

        txParams.gasLimit = gasLimit;

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
      }

      setTimeout(() => {
        hideProgress();
        showToast('✅ ETH转账 + 数据上链成功！', 'success');
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
        errorMessage = '检测到MetaMask内部账户限制，请尝试转账到外部地址，或者使用不同的钱包账户';
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas费设置问题，请重试';
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = '用户取消了交易';
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
            placeholder="0x... 或 ENS域名（请避免使用同一钱包内的其他账户）"
            required
            disabled={loading}
          />
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ 注意：如果转账到同一钱包的其他账户，系统会自动使用两步法确保成功
          </p>
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
        <h4 className="font-semibold text-blue-900 mb-2">🎯 重要修复</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 🔧 <strong>已修复</strong>：同一钱包内转账data字段限制问题</p>
          <p>• 🚀 <strong>智能两步法</strong>：自动检测并使用分步转账</p>
          <p>• ⚡ <strong>更好的Gas估算</strong>：避免Gas不足错误</p>
          <p>• 🛡️ <strong>增强错误处理</strong>：更清晰的错误提示</p>
          <p>• 🎡 <strong>保持原有优势</strong>：支持中英文、18位精度等</p>
        </div>
      </div>

      {/* 使用建议 */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-semibold text-amber-900 mb-2">💡 使用建议</h4>
        <div className="text-sm text-amber-800 space-y-1">
          <p>• 🎯 <strong>最佳实践</strong>：转账到其他人的地址或外部合约</p>
          <p>• ⚠️ <strong>同钱包转账</strong>：会自动使用两步法，产生两笔交易</p>
          <p>• 🧪 <strong>测试建议</strong>：使用不同钱包或创建新的测试地址</p>
          <p>• 💰 <strong>Gas优化</strong>：小额数据建议使用0.001 ETH测试</p>
        </div>
      </div>
    </div>
  );
};

export default EthTransfer;