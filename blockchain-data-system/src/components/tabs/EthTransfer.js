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
    data: '你好世界！这是一条中文测试数据。Hello World! This is test data.',
    transferMode: 'external' // 新增：转账模式选择
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

  // 安全的Gas费获取
  const getSafeGasPrice = async (provider) => {
    try {
      // 首先尝试获取 EIP-1559 费用数据
      const feeData = await provider.getFeeData();
      
      if (feeData.gasPrice) {
        return {
          gasPrice: feeData.gasPrice,
          type: 'legacy'
        };
      }
      
      // 如果失败，使用固定的安全值
      const network = await provider.getNetwork();
      const chainId = network.chainId;
      
      // 根据不同网络设置不同的Gas价格
      let safeGasPrice;
      switch (chainId) {
        case 1n: // 主网
          safeGasPrice = ethers.parseUnits('20', 'gwei');
          break;
        case 11155111n: // Sepolia 测试网
        case 5n: // Goerli 测试网
          safeGasPrice = ethers.parseUnits('2', 'gwei');
          break;
        default: // 其他网络
          safeGasPrice = ethers.parseUnits('2', 'gwei');
      }
      
      return {
        gasPrice: safeGasPrice,
        type: 'legacy'
      };
    } catch (error) {
      console.warn('获取Gas价格失败，使用默认值:', error);
      return {
        gasPrice: ethers.parseUnits('2', 'gwei'),
        type: 'legacy'
      };
    }
  };

  // 安全的交易发送
  const sendTransactionSafely = async (signer, txParams) => {
    try {
      const provider = signer.provider;
      
      // 获取安全的Gas价格
      const gasData = await getSafeGasPrice(provider);
      
      // 确保交易参数使用Legacy格式（避免EIP-1559问题）
      const safeTxParams = {
        to: txParams.to,
        value: txParams.value || 0n,
        gasPrice: gasData.gasPrice,
        gasLimit: txParams.gasLimit || 21000n
      };
      
      // 只有在有数据时才添加data字段
      if (txParams.data && txParams.data !== '0x') {
        safeTxParams.data = txParams.data;
      }
      
      console.log('发送交易参数:', {
        to: safeTxParams.to,
        value: safeTxParams.value.toString(),
        gasPrice: safeTxParams.gasPrice.toString(),
        gasLimit: safeTxParams.gasLimit.toString(),
        hasData: !!safeTxParams.data
      });
      
      return await signer.sendTransaction(safeTxParams);
    } catch (error) {
      console.error('发送交易失败:', error);
      throw error;
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
    if (wallet.address.toLowerCase() === form.address.toLowerCase()) {
      showToast('不能转账给自己，请输入其他地址', 'error');
      return;
    }

    setLoading(true);
    try {
      showProgress('准备ETH转账 + 数据上链...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountWei = ethers.parseEther(form.amount);
      const encodedData = ethers.hexlify(ethers.toUtf8Bytes(form.data));

      updateProgress(2);

      // 检查余额（包含预估Gas费）
      const balance = await provider.getBalance(wallet.address);
      const gasData = await getSafeGasPrice(provider);
      const estimatedGasCost = gasData.gasPrice * 200000n; // 预估最大Gas费
      
      if (balance < (amountWei + estimatedGasCost)) {
        throw new Error('ETH余额不足以支付转账金额和Gas费');
      }

      updateProgress(3);

      // 根据用户选择的模式执行不同策略
      if (form.transferMode === 'split') {
        // 强制使用分离模式：先转ETH，再上链数据
        console.log('使用分离模式：分别进行ETH转账和数据上链');
        showToast('使用分离模式，将分两步完成', 'info');
        
        // 第一步：纯ETH转账
        showProgress('第一步：执行ETH转账...');
        updateProgress(3.5);
        
        const ethTxParams = {
          to: form.address,
          value: amountWei,
          gasLimit: 21000n // ETH转账固定Gas
        };
        
        const ethTx = await sendTransactionSafely(signer, ethTxParams);
        const ethReceipt = await ethTx.wait();
        
        // 第二步：发送数据到任意地址（建议发送到自己）
        showProgress('第二步：上链数据...');
        updateProgress(4.5);
        
        // 计算数据交易的Gas
        const dataGasEstimate = 21000n + BigInt((encodedData.length - 2) / 2) * 16n + 10000n;
        
        const dataTxParams = {
          to: wallet.address, // 发送给自己，避免内部账户限制
          value: 0n,
          data: encodedData,
          gasLimit: dataGasEstimate
        };
        
        const dataTx = await sendTransactionSafely(signer, dataTxParams);
        const dataReceipt = await dataTx.wait();
        
        // 记录两个交易
        addRecord({
          type: '🔗 ETH转账(分离模式)',
          hash: ethTx.hash,
          amount: `${form.amount} ETH`,
          data: '(第一步：ETH转账)',
          gasUsed: ethReceipt.gasUsed.toString(),
          blockNumber: ethReceipt.blockNumber,
          extra: `目标地址: ${form.address}`
        });
        
        addRecord({
          type: '🔗 数据上链(分离模式)',
          hash: dataTx.hash,
          amount: '0 ETH',
          data: form.data,
          gasUsed: dataReceipt.gasUsed.toString(),
          blockNumber: dataReceipt.blockNumber,
          extra: `数据长度: ${form.data.length} 字符`
        });
        
      } else {
        // 尝试一体化模式：一次交易完成转账+数据
        console.log('尝试一体化模式：一次交易完成ETH转账和数据上链');
        
        // 计算Gas限制
        const baseGas = 21000n;
        const dataGas = BigInt((encodedData.length - 2) / 2) * 16n; // 每字节16 gas
        const bufferGas = 30000n; // 缓冲Gas
        const totalGasLimit = baseGas + dataGas + bufferGas;
        
        const txParams = {
          to: form.address,
          value: amountWei,
          data: encodedData,
          gasLimit: totalGasLimit
        };

        showProgress('发送一体化交易...');
        updateProgress(4);

        try {
          const tx = await sendTransactionSafely(signer, txParams);

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
            extra: `数据长度: ${form.data.length} 字符，一体化成功`
          });
          
        } catch (oneStepError) {
          console.warn('一体化模式失败，自动切换到分离模式:', oneStepError);
          
          if (oneStepError.message.includes('cannot include data') || 
              oneStepError.message.includes('internal accounts')) {
            
            showToast('检测到内部账户限制，自动切换到分离模式...', 'info');
            
            // 自动切换到分离模式
            showProgress('切换到分离模式：第一步 ETH转账...');
            updateProgress(4.2);
            
            const ethTxParams = {
              to: form.address,
              value: amountWei,
              gasLimit: 21000n
            };
            
            const ethTx = await sendTransactionSafely(signer, ethTxParams);
            const ethReceipt = await ethTx.wait();
            
            showProgress('分离模式：第二步 数据上链...');
            updateProgress(4.7);
            
            const dataGasEstimate = 21000n + BigInt((encodedData.length - 2) / 2) * 16n + 10000n;
            
            const dataTxParams = {
              to: wallet.address, // 发送给自己
              value: 0n,
              data: encodedData,
              gasLimit: dataGasEstimate
            };
            
            const dataTx = await sendTransactionSafely(signer, dataTxParams);
            const dataReceipt = await dataTx.wait();
            
            addRecord({
              type: '🔗 ETH转账(自动分离)',
              hash: ethTx.hash,
              amount: `${form.amount} ETH`,
              data: '(第一步：ETH转账)',
              gasUsed: ethReceipt.gasUsed.toString(),
              blockNumber: ethReceipt.blockNumber,
              extra: `自动分离模式 - ETH部分`
            });
            
            addRecord({
              type: '🔗 数据上链(自动分离)',
              hash: dataTx.hash,
              amount: '0 ETH',
              data: form.data,
              gasUsed: dataReceipt.gasUsed.toString(),
              blockNumber: dataReceipt.blockNumber,
              extra: `自动分离模式 - 数据部分`
            });
          } else {
            throw oneStepError; // 如果不是data字段问题，则抛出原错误
          }
        }
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
        errorMessage = '检测到MetaMask内部账户限制，建议切换到分离模式';
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas费设置问题，请重试';
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = '用户取消了交易';
      } else if (error.message.includes('maxPriorityFeePerGas')) {
        errorMessage = 'Gas费类型不兼容，已自动使用兼容模式';
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
        {/* 转账模式选择 */}
        <div>
          <label className="block text-sm font-medium mb-2">🎯 转账模式</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, transferMode: 'external' }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                form.transferMode === 'external' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              <div className="text-sm font-medium">🚀 一体化模式</div>
              <div className="text-xs">一次交易完成（推荐）</div>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, transferMode: 'split' }))}
              className={`p-3 rounded-lg border-2 transition-all ${
                form.transferMode === 'split' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              disabled={loading}
            >
              <div className="text-sm font-medium">🔄 分离模式</div>
              <div className="text-xs">分两步执行（兼容性好）</div>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 一体化模式失败时会自动切换到分离模式
          </p>
        </div>

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
          {form.transferMode === 'split' && (
            <p className="text-xs text-blue-600 mt-1">
              ℹ️ 分离模式：ETH发送到此地址，数据发送到你的地址
            </p>
          )}
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
            `🚀 ${form.transferMode === 'split' ? '分离模式' : '一体化'}转账上链`
          )}
        </button>
      </form>

      {/* 功能说明 */}
      <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">🎯 全面修复</h4>
        <div className="text-sm text-green-800 space-y-1">
          <p>• 🔧 <strong>修复Gas费错误</strong>：解决 maxPriorityFeePerGas 问题</p>
          <p>• 🛡️ <strong>Legacy Gas模式</strong>：避免EIP-1559兼容性问题</p>
          <p>• 🚀 <strong>智能模式切换</strong>：一体化失败自动切换分离模式</p>
          <p>• 💡 <strong>手动模式选择</strong>：用户可选择转账策略</p>
          <p>• ⚡ <strong>更安全的Gas估算</strong>：动态适配不同网络</p>
        </div>
      </div>

      {/* 模式说明 */}
      <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">📋 模式说明</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>🚀 一体化模式：</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>一次交易同时完成ETH转账和数据上链</li>
              <li>Gas费用更低，效率更高</li>
              <li>遇到限制时自动切换到分离模式</li>
            </ul>
          </div>
          <div>
            <strong>🔄 分离模式：</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>第一步：ETH转账到目标地址</li>
              <li>第二步：数据上链到自己地址</li>
              <li>兼容性最好，适合所有场景</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EthTransfer;