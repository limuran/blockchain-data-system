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

  useEffect(() => {
    const checkContract = async () => {
      if (contractAddress && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const code = await provider.getCode(contractAddress);
          
          if (code !== '0x') {
            const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABI, provider);
            const totalCount = await contract.getDataCount();
            
            setContractInfo({
              isValid: true,
              totalDataCount: Number(totalCount),
              address: contractAddress
            });
          } else {
            setContractInfo({ isValid: false, error: '地址不是智能合约' });
          }
        } catch (e) {
          setContractInfo({ isValid: false, error: '合约验证失败: ' + e.message });
        }
      }
    };

    if (contractAddress) checkContract();
  }, [contractAddress]);

  const handleDeploy = async () => {
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    setDeploying(true);
    try {
      showProgress('部署DataStorage合约...');
      
      // 模拟部署过程
      for (let i = 1; i <= 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateProgress(i);
      }

      // 生成模拟地址
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

    setLoading(true);
    try {
      showProgress('合约数据写入中...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABI, signer);

      updateProgress(2);

      const tx = await contract.storeData(form.data, form.dataType);
      
      updateProgress(3);
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
              placeholder="0x... 或点击部署"
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

          {contractInfo && (
            <div className={`mt-2 p-3 rounded-lg border ${
              contractInfo.isValid ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
            }`}>
              {contractInfo.isValid ? (
                <div className="text-sm text-green-700">
                  <p>✅ 合约验证成功</p>
                  <p>📊 已存储数据: {contractInfo.totalDataCount} 条</p>
                </div>
              ) : (
                <p className="text-sm text-red-700">❌ {contractInfo.error}</p>
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
          disabled={loading || !contractAddress}
          className={`w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 rounded-lg font-semibold transition-all ${
            loading || !contractAddress
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {loading ? '写入中...' : '📝 写入合约数据'}
        </button>
      </div>
    </div>
  );
};

export default ContractStorage;