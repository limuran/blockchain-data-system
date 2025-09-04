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

  // 🔥 使用从Remix复制的完整ABI
  const getRemixABI = () => {
    return [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "deployer", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "blockNumber", "type": "uint256"}
        ],
        "name": "ContractDeployed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
          {"indexed": false, "internalType": "string", "name": "data", "type": "string"},
          {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"indexed": true, "internalType": "string", "name": "dataType", "type": "string"},
          {"indexed": true, "internalType": "uint256", "name": "entryId", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "blockNumber", "type": "uint256"},
          {"indexed": false, "internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
        ],
        "name": "DataStored",
        "type": "event"
      },
      {
        "inputs": [
          {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
        ],
        "name": "dataHashExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "dataEntries",
        "outputs": [
          {"internalType": "address", "name": "user", "type": "address"},
          {"internalType": "string", "name": "data", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "string", "name": "dataType", "type": "string"},
          {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
          {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "string", "name": "dataType", "type": "string"}
        ],
        "name": "getDataByType",
        "outputs": [
          {
            "components": [
              {"internalType": "address", "name": "user", "type": "address"},
              {"internalType": "string", "name": "data", "type": "string"},
              {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
              {"internalType": "string", "name": "dataType", "type": "string"},
              {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
              {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
            ],
            "internalType": "struct DataStorage.DataEntry[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getDataCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "string", "name": "data", "type": "string"},
          {"internalType": "string", "name": "dataType", "type": "string"}
        ],
        "name": "storeData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  };

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
        
        console.log('🔍 开始验证合约:', contractAddress);
        
        // 使用Remix兼容的ABI
        try {
          const contract = new ethers.Contract(contractAddress, getRemixABI(), provider);
          
          // 尝试调用getDataCount
          const dataCount = await contract.getDataCount();
          console.log('✅ getDataCount调用成功:', Number(dataCount));
          
          // 尝试获取所有者信息
          let ownerInfo = '';
          try {
            const owner = await contract.owner();
            ownerInfo = ` (所有者: ${owner.slice(0,6)}...${owner.slice(-4)})`;
          } catch (e) {
            console.log('无法获取所有者信息');
          }
          
          setContractInfo({
            isValid: true,
            totalDataCount: Number(dataCount),
            address: contractAddress,
            ownerInfo
          });
        } catch (contractError) {
          console.error('合约调用失败:', contractError);
          
          // 尝试更基础的验证
          try {
            // 检查合约是否有预期的函数选择器
            const iface = new ethers.Interface(getRemixABI());
            const getDataCountSelector = iface.getFunction('getDataCount').selector;
            console.log('预期的getDataCount选择器:', getDataCountSelector);
            
            setContractInfo({ 
              isValid: false, 
              error: `合约验证失败: ${contractError.reason || contractError.message}` 
            });
          } catch (e) {
            setContractInfo({ 
              isValid: false, 
              error: '合约ABI不匹配或函数不存在' 
            });
          }
        }
        
      } catch (e) {
        console.error('网络错误:', e);
        setContractInfo({ 
          isValid: false, 
          error: '网络连接失败: ' + e.message 
        });
      }
    };

    // 防抖处理
    const debounceTimer = setTimeout(checkContract, 1000);
    return () => clearTimeout(debounceTimer);
  }, [contractAddress]);

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
      showToast('请等待合约验证完成', 'error');
      return;
    }

    setLoading(true);
    try {
      showProgress('合约数据写入中...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 使用验证成功的ABI
      const contract = new ethers.Contract(contractAddress, getRemixABI(), signer);

      updateProgress(2);

      console.log('🚀 准备调用storeData函数');
      console.log('数据:', form.data);
      console.log('类型:', form.dataType);

      // 估算Gas
      const gasEstimate = await contract.storeData.estimateGas(form.data, form.dataType);
      console.log('💰 Gas估算:', gasEstimate.toString());
      
      updateProgress(3);

      // 执行合约调用
      const tx = await contract.storeData(form.data, form.dataType, {
        gasLimit: gasEstimate * 120n / 100n // 增加20%缓冲
      });
      
      console.log('📤 交易已发送:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ 交易确认:', receipt);
      
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

  const handleDeploy = () => {
    showToast('💡 请在Remix中部署真实的DataStorage合约', 'info');
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
              placeholder="0xcD6a42782d230D7c13A74ddec5dD140e55499Df9 (你的新合约地址)"
            />
            <button
              type="button"
              onClick={handleDeploy}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600"
            >
              💡 Remix部署
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
                    <p>✅ 合约验证成功{contractInfo.ownerInfo}</p>
                    <p>📊 已存储数据: {contractInfo.totalDataCount} 条</p>
                    <p className="text-xs text-green-600 mt-1">
                      🎉 可以开始存储数据了！
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-700">❌ {contractInfo.error}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>🔧 故障排除:</p>
                    <p>1. 确认使用的是DataStorage.sol合约代码</p>
                    <p>2. 检查MetaMask连接的网络(应为Sepolia)</p>
                    <p>3. 验证合约地址复制正确</p>
                    <p>4. 查看浏览器控制台的详细错误</p>
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
        
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 最新信息</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• 🆕 新合约地址: 0xcD6a42782d230D7c13A74ddec5dD140e55499Df9</p>
            <p>• 📍 部署区块: Block 13 (startBlock用这个)</p>
            <p>• 🔧 使用Solidity 0.8.19编译</p>
            <p>• ✅ ABI已更新为Remix兼容格式</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStorage;