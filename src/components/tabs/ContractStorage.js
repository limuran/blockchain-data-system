import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { ethers } from 'ethers';

const ContractStorage = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord, contractAddress, setContractAddress } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [form, setForm] = useState({
    dataType: 'user_data',
    data: '用户注册信息: 姓名:张三 邮箱:zhangsan@example.com 时间:2025-01-15 User info: John john@example.com'
  });

  const DATA_STORAGE_ABI = [
    'function storeData(string memory data, string memory dataType) external',
    'function getDataCount() external view returns (uint256)',
    'event DataStored(address indexed user, string data, uint256 timestamp, string dataType, uint256 indexed entryId, uint256 blockNumber)'
  ];

  // 检查合约状态的改进版本
  useEffect(() => {
    const checkContract = async () => {
      if (!contractAddress || !window.ethereum) {
        setContractInfo(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 首先检查地址格式
        if (!ethers.isAddress(contractAddress)) {
          setContractInfo({ isValid: false, error: '无效的地址格式' });
          return;
        }
        
        // 检查是否是合约地址
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          setContractInfo({ isValid: false, error: '该地址不是智能合约' });
          return;
        }
        
        // 尝试调用合约函数
        try {
          const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABI, provider);
          
          // 使用静态调用避免状态改变
          const dataCount = await contract.getDataCount.staticCall();
          
          setContractInfo({
            isValid: true,
            totalDataCount: Number(dataCount),
            address: contractAddress
          });
        } catch (contractError) {
          console.log('合约调用失败:', contractError);
          setContractInfo({ 
            isValid: false, 
            error: '合约ABI不匹配，可能不是DataStorage合约' 
          });
        }
      } catch (e) {
        console.error('合约验证错误:', e);
        setContractInfo({ 
          isValid: false, 
          error: '网络错误或合约验证失败' 
        });
      }
    };

    // 防抖处理，避免频繁调用
    const debounceTimer = setTimeout(checkContract, 500);
    return () => clearTimeout(debounceTimer);
  }, [contractAddress]);

  const handleDeploy = async () => {
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    setDeploying(true);
    try {
      showProgress('部署DataStorage合约到 ' + (wallet.chainName || '当前网络') + '...');
      updateProgress(1);

      // 模拟部署过程 - 在实际使用中，这里需要真实的合约字节码
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProgress(2);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProgress(3);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress(4);

      // 生成模拟地址 - 实际使用中替换为真实部署
      const mockAddress = '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');

      setContractAddress(mockAddress);
      
      setTimeout(() => {
        hideProgress();
        showToast('✅ 合约部署成功！', 'success');
      }, 500);
    } catch (error) {
      hideProgress();
      showToast('部署失败: ' + error.message, 'error');
    } finally {
      setDeploying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!contractAddress) {
      showToast('请先部署合约或输入合约地址', 'error');
      return;
    }

    if (!contractInfo?.isValid) {
      showToast('请输入有效的DataStorage合约地址', 'error');
      return;
    }

    setLoading(true);
    try {
      showProgress('合约数据写入中...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABI, signer);

      updateProgress(2);

      // 估算Gas
      const gasEstimate = await contract.storeData.estimateGas(form.data, form.dataType);
      
      updateProgress(3);

      // 执行合约调用
      const tx = await contract.storeData(form.data, form.dataType, {
        gasLimit: gasEstimate * 120n / 100n // 增加20%缓冲
      });

      const receipt = await tx.wait();
      updateProgress(4);

      addRecord({
        type: '📝 合约存储',
        hash: tx.hash,
        data: form.data,
        dataType: form.dataType,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        contractAddress
      });

      setTimeout(() => {
        hideProgress();
        showToast('✅ 数据写入合约成功！', 'success');
      }, 500);
    } catch (error) {
      hideProgress();
      console.error('合约写入失败:', error);
      showToast('合约写入失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">📝</span>
        <div>
          <h3 className="text-lg font-bold text-green-900">智能合约数据存储</h3>
          <p className="text-green-700 text-sm">
            方式3: 通过专用合约以事件日志形式永久存储任意字符串
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">🏢 数据存储合约</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-mono text-sm"
              placeholder="0x... 或点击部署新合约"
            />
            <button
              type="button"
              onClick={handleDeploy}
              disabled={deploying}
              className={`bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-all ${
                deploying ? 'opacity-50' : 'hover:bg-green-600'
              }`}
            >
              {deploying ? '部署中...' : '🚀 部署'}
            </button>
          </div>

          {contractAddress && (
            <div className="mt-2">
              {contractInfo === null ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">🔍 验证合约中...</p>
                </div>
              ) : contractInfo.isValid ? (
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                  <div className="text-sm text-green-700">
                    <p>✅ 合约验证成功</p>
                    <p>📊 已存储数据: {contractInfo.totalDataCount} 条</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-700">❌ {contractInfo.error}</p>
                  <p className="text-xs text-red-600 mt-1">
                    💡 提示: 请确保输入的是有效的DataStorage合约地址
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">📂 数据类型</label>
          <select
            value={form.dataType}
            onChange={(e) => setForm(prev => ({ ...prev, dataType: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none"
          >
            <option value="user_data">👤 用户数据</option>
            <option value="transaction_log">💳 交易记录</option>
            <option value="system_event">⚙️ 系统事件</option>
            <option value="business_data">💼 业务数据</option>
            <option value="custom">🔧 自定义</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">📄 存储数据（任意字符串）</label>
          <textarea
            value={form.data}
            rows="5"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none text-sm"
            placeholder="输入任意数据，支持中文、英文、数字等..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            📊 数据将触发 DataStored 事件，自动被The Graph索引
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !contractAddress || (contractInfo && !contractInfo.isValid)}
          className={`w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-lg font-semibold transition-all ${
            loading || !contractAddress || (contractInfo && !contractInfo.isValid)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {loading ? '写入中...' : '📝 写入合约数据'}
        </button>
        
        <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">🎯 使用说明</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>• 🚀 点击"部署"按钮创建新的DataStorage合约</p>
            <p>• 📍 或者输入已部署的合约地址</p>
            <p>• ✅ 系统会自动验证合约有效性</p>
            <p>• 📝 验证通过后即可存储任意字符串数据</p>
            <p>• 🔍 存储的数据可通过"数据查询"标签页查看</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStorage;