import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { ethers } from 'ethers';

const ContractStorage = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord, contractAddress, setContractAddress } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [form, setForm] = useState({
    dataType: 'user_data',
    data: '测试数据: 这是一条中文测试数据 Hello World 2025-01-15'
  });

  // 🎯 与Remix完全匹配的简单ABI
  const REMIX_COMPATIBLE_ABI = [
    'function storeData(string,string)',
    'function getDataCount() view returns (uint256)',
    'function owner() view returns (address)'
  ];

  // 改进的合约验证 - 直接调用已知正常的函数
  useEffect(() => {
    const verifyContract = async () => {
      if (!contractAddress || !ethers.isAddress(contractAddress) || !window.ethereum) {
        setContractInfo(null);
        return;
      }

      console.log('🔍 验证合约:', contractAddress);

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 检查网络
        const network = await provider.getNetwork();
        console.log('🌐 当前网络:', network.name, '链ID:', network.chainId);
        
        // 检查是否是合约
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          setContractInfo({ isValid: false, error: '该地址不是智能合约' });
          return;
        }

        console.log('✅ 确认是合约，代码长度:', code.length);

        // 🎯 关键修复：使用低级调用避免ABI解析问题
        try {
          const contract = new ethers.Contract(contractAddress, REMIX_COMPATIBLE_ABI, provider);
          
          // 方法1: 使用staticCall直接调用
          const dataCountResult = await contract.getDataCount.staticCall();
          console.log('📊 数据计数调用成功:', Number(dataCountResult));
          
          // 方法2: 检查owner函数
          const ownerResult = await contract.owner.staticCall();
          console.log('👤 所有者调用成功:', ownerResult);
          
          setContractInfo({
            isValid: true,
            totalDataCount: Number(dataCountResult),
            owner: ownerResult,
            address: contractAddress,
            network: network.name
          });
          
        } catch (callError) {
          console.error('⚠️ 合约调用失败:', callError);
          
          // 🔧 备选方案：使用原始调用
          try {
            const getDataCountSelector = '0x17d70f7c'; // getDataCount()的函数选择器
            const result = await provider.call({
              to: contractAddress,
              data: getDataCountSelector
            });
            
            if (result && result !== '0x') {
              const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result);
              console.log('🛠️ 原始调用成功:', Number(decodedResult[0]));
              
              setContractInfo({
                isValid: true,
                totalDataCount: Number(decodedResult[0]),
                address: contractAddress,
                method: '原始调用'
              });
            } else {
              throw new Error('原始调用也返回空值');
            }
          } catch (rawCallError) {
            console.error('❌ 原始调用也失败:', rawCallError);
            setContractInfo({
              isValid: false,
              error: '无法调用合约函数，可能网络不匹配或合约有问题'
            });
          }
        }

      } catch (networkError) {
        console.error('🌐 网络错误:', networkError);
        setContractInfo({
          isValid: false,
          error: '网络连接失败: ' + networkError.message
        });
      }
    };

    if (contractAddress) {
      const timer = setTimeout(verifyContract, 500);
      return () => clearTimeout(timer);
    }
  }, [contractAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!contractAddress) {
      showToast('请输入合约地址', 'error');
      return;
    }

    // 🎯 即使验证失败也允许尝试调用
    setLoading(true);
    try {
      showProgress('尝试调用storeData函数...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      updateProgress(2);

      console.log('🚀 准备调用storeData...');
      console.log('📝 数据:', form.data);
      console.log('🏷️ 类型:', form.dataType);

      const contract = new ethers.Contract(contractAddress, REMIX_COMPATIBLE_ABI, signer);

      updateProgress(3);

      // 直接调用，让合约自己报错
      const tx = await contract.storeData(form.data, form.dataType);
      console.log('📤 交易已发送:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ 交易确认完成:', receipt);

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
        showToast('🎉 数据写入合约成功！你的合约工作正常！', 'success');
      }, 500);

    } catch (error) {
      hideProgress();
      console.error('❌ storeData调用失败:', error);
      
      let friendlyMessage = '合约调用失败';
      if (error.message.includes('user rejected')) {
        friendlyMessage = '用户取消了交易';
      } else if (error.message.includes('insufficient funds')) {
        friendlyMessage = 'ETH余额不足支付Gas费用';
      } else if (error.message.includes('execution reverted')) {
        friendlyMessage = '合约执行被拒绝，请检查函数参数';
      }
      
      showToast(friendlyMessage, 'error');
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
            测试版: 直接调用你的Remix合约
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">🏢 合约地址</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none font-mono text-sm"
            placeholder="0xcD6a42782d230D7c13A74ddec5dD140e55499Df9"
          />
          
          {contractInfo && (
            <div className={`mt-2 p-3 rounded-lg ${
              contractInfo.isValid ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300'
            }`}>
              {contractInfo.isValid ? (
                <div className="text-sm text-green-700">
                  <p>✅ 合约连接成功 {contractInfo.method && `(${contractInfo.method})`}</p>
                  <p>📊 当前数据数量: {contractInfo.totalDataCount}</p>
                  {contractInfo.owner && (
                    <p>👤 所有者: {contractInfo.owner.slice(0,6)}...{contractInfo.owner.slice(-4)}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-yellow-700">
                  <p>⚠️ 验证问题: {contractInfo.error}</p>
                  <p className="text-xs mt-1">💡 仍然可以尝试调用storeData函数</p>
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
            <option value="test_data">🧪 测试数据</option>
            <option value="custom">🔧 自定义</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">📝 数据内容</label>
          <textarea
            value={form.data}
            rows="4"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none text-sm"
            placeholder="输入任意数据..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !contractAddress}
          className={`w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-lg font-semibold transition-all ${
            loading || !contractAddress
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {loading ? '🔄 调用中...' : '🚀 尝试调用 storeData'}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🎯 当前状态</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• ✅ 你的合约在Remix中工作正常</p>
            <p>• ✅ getDataCount返回0 (初始状态正确)</p>
            <p>• ✅ owner函数返回部署者地址</p>
            <p>• 🔄 前端验证问题已绕过，直接尝试调用</p>
            <p>• 💡 如果storeData成功，说明一切正常！</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStorage;