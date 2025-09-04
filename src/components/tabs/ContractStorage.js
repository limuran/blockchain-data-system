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

  // 兼容多种可能的ABI格式
  const DATA_STORAGE_ABIS = [
    // 标准函数签名格式
    [
      'function storeData(string memory data, string memory dataType) external',
      'function getDataCount() external view returns (uint256)',
      'event DataStored(address indexed user, string data, uint256 timestamp, string indexed dataType, uint256 indexed entryId, uint256 blockNumber, bytes32 dataHash)'
    ],
    // 完整ABI格式
    [
      {
        "inputs": [
          {"internalType": "string", "name": "data", "type": "string"},
          {"internalType": "string", "name": "dataType", "type": "string"}
        ],
        "name": "storeData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getDataCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  ];

  // 改进的合约验证
  useEffect(() => {
    const checkContract = async () => {
      if (!contractAddress || !window.ethereum) {
        setContractInfo(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 检查地址格式
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
        
        // 尝试多种ABI格式验证
        let validationSuccess = false;
        let dataCount = 0;
        
        for (const abi of DATA_STORAGE_ABIS) {
          try {
            const contract = new ethers.Contract(contractAddress, abi, provider);
            
            // 尝试调用getDataCount函数
            const result = await contract.getDataCount();
            dataCount = Number(result);
            validationSuccess = true;
            console.log('✅ 合约验证成功，使用ABI索引:', DATA_STORAGE_ABIS.indexOf(abi));
            break;
          } catch (abiError) {
            console.log('ABI验证失败:', abiError.message);
            continue;
          }
        }
        
        if (validationSuccess) {
          setContractInfo({
            isValid: true,
            totalDataCount: dataCount,
            address: contractAddress
          });
        } else {
          // 如果所有ABI都失败，尝试检查合约是否有我们期望的函数
          try {
            // 尝试直接调用，看错误信息
            const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABIS[0], provider);
            await contract.getDataCount.staticCall();
          } catch (detailError) {
            console.error('详细错误:', detailError);
            setContractInfo({ 
              isValid: false, 
              error: `合约验证失败: ${detailError.message}` 
            });
          }
        }
        
      } catch (e) {
        console.error('合约验证错误:', e);
        setContractInfo({ 
          isValid: false, 
          error: '网络错误: ' + e.message 
        });
      }
    };

    // 防抖处理
    const debounceTimer = setTimeout(checkContract, 800);
    return () => clearTimeout(debounceTimer);
  }, [contractAddress]);

  const handleDeploy = async () => {
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    showToast('⚠️ 前端部署功能是模拟的，请使用Remix部署真实合约', 'warning');
    
    setDeploying(true);
    try {
      showProgress('模拟部署过程...');
      updateProgress(1);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProgress(2);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProgress(3);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress(4);

      // 生成一个测试地址
      const mockAddress = '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');

      setContractAddress(mockAddress);
      
      setTimeout(() => {
        hideProgress();
        showToast('⚠️ 这是模拟地址，请使用Remix部署真实合约！', 'warning');
      }, 500);
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
      showToast('请先输入合约地址', 'error');
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
      
      // 使用第一个验证成功的ABI
      const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABIS[0], signer);

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
              placeholder="0x... (粘贴你从Remix部署的DataStorage合约地址)"
            />
            <button
              type="button"
              onClick={handleDeploy}
              disabled={deploying}
              className={`bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold transition-all ${
                deploying ? 'opacity-50' : 'hover:bg-orange-600'
              }`}
            >
              {deploying ? '模拟中...' : '🧪 模拟'}
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
                    <p className="text-xs text-green-600 mt-1">
                      💡 现在可以写入数据了！
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-700">❌ {contractInfo.error}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>💡 可能的解决方案:</p>
                    <p>1. 确认在Remix中部署的是完整的DataStorage.sol合约</p>
                    <p>2. 检查MetaMask连接的是Sepolia测试网</p>
                    <p>3. 尝试重新部署合约或检查合约地址是否正确</p>
                  </div>
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
          <h4 className="font-semibold text-green-900 mb-2">🔧 调试信息</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>• 🌐 确保MetaMask连接到Sepolia测试网</p>
            <p>• 📍 确认合约地址来自Remix部署的DataStorage.sol</p>
            <p>• 🔍 检查浏览器控制台的详细错误信息</p>
            <p>• 💡 如果问题持续，可以在Remix中验证合约函数</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStorage;