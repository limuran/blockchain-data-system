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

  // 🎯 超级简化的ABI - 只要能调用就行
  const SIMPLE_ABI = [
    'function storeData(string,string) payable',
    'function getDataCount() view returns (uint256)'
  ];

  // 简化的合约检查
  useEffect(() => {
    const checkContract = async () => {
      if (!contractAddress || !ethers.isAddress(contractAddress)) {
        setContractInfo(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const code = await provider.getCode(contractAddress);
        
        if (code === '0x') {
          setContractInfo({ isValid: false, error: '不是智能合约地址' });
        } else {
          // 🎯 直接假设是有效合约，不做复杂验证
          setContractInfo({
            isValid: true,
            address: contractAddress,
            totalDataCount: '未知',
            note: '已跳过复杂验证，直接尝试调用'
          });
        }
      } catch (e) {
        setContractInfo({ isValid: false, error: '网络错误' });
      }
    };

    if (contractAddress) {
      const timer = setTimeout(checkContract, 300);
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

    setLoading(true);
    try {
      showProgress('尝试写入合约数据...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      updateProgress(2);

      // 🚀 直接尝试调用，不预先验证
      const contract = new ethers.Contract(contractAddress, SIMPLE_ABI, signer);
      
      console.log('📝 调用storeData函数...');
      console.log('数据:', form.data);
      console.log('类型:', form.dataType);

      updateProgress(3);

      // 直接发送交易
      const tx = await contract.storeData(form.data, form.dataType);
      console.log('📤 交易发送成功:', tx.hash);

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
        showToast('🎉 数据写入成功！合约调用正常！', 'success');
      }, 500);

    } catch (error) {
      hideProgress();
      console.error('❌ 详细错误:', error);
      
      // 友好的错误提示
      let errorMsg = '合约调用失败';
      if (error.message.includes('user rejected')) {
        errorMsg = '用户取消了交易';
      } else if (error.message.includes('insufficient funds')) {
        errorMsg = 'ETH余额不足支付Gas费用';
      } else if (error.message.includes('execution reverted')) {
        errorMsg = '合约执行被拒绝，可能是函数不存在或参数错误';
      }
      
      showToast(errorMsg, 'error');
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
            简化版本: 直接调用合约，无复杂验证
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
            placeholder="0xcD6a42782d230D7c13A74ddec5dD140e55499Df9 (粘贴你的合约地址)"
          />
          
          {contractInfo && (
            <div className={`mt-2 p-3 rounded-lg ${
              contractInfo.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <p className="text-sm">
                {contractInfo.isValid ? '✅ 准备就绪，可以尝试调用' : `❌ ${contractInfo.error}`}
              </p>
              {contractInfo.note && (
                <p className="text-xs mt-1">{contractInfo.note}</p>
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
          {loading ? '🔄 调用中...' : '🚀 直接调用合约'}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 简化说明</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• ⚡ 跳过复杂的ABI验证，直接尝试调用</p>
            <p>• 🎯 如果你的合约有storeData函数，就会成功</p>
            <p>• 📊 成功后会在交易记录中显示</p>
            <p>• 🔍 可以用区块浏览器验证交易</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStorage;