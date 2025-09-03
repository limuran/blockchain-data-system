import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { ethers } from 'ethers';
import TransactionTable from '../ui/TransactionTable';

const DataQuery = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const [activeQueryTab, setActiveQueryTab] = useState('transaction');
  const [loading, setLoading] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [form, setForm] = useState({
    transactionHash: '',
    address: '',
    blockNumber: '',
    graphqlQuery: `query GetRecentData {
  dataStoreds(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user
    data
    dataType
    timestamp
    blockNumber
    transactionHash
  }
}`
  });

  const handleTransactionQuery = async () => {
    if (!form.transactionHash.trim()) {
      showToast('请输入交易哈希', 'error');
      return;
    }

    setLoading(true);
    try {
      showProgress('查询交易数据中...');
      updateProgress(1);

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      updateProgress(2);
      const tx = await provider.getTransaction(form.transactionHash);
      if (!tx) {
        throw new Error('未找到该交易');
      }

      updateProgress(3);
      const receipt = await provider.getTransactionReceipt(form.transactionHash);
      
      updateProgress(4);
      
      // 解码data字段
      let decodedData = null;
      if (tx.data && tx.data !== '0x') {
        try {
          decodedData = ethers.toUtf8String(tx.data);
        } catch (e) {
          decodedData = '无法解码的二进制数据';
        }
      }

      const result = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value || 0),
        gasUsed: receipt?.gasUsed?.toString() || 'N/A',
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : 'N/A',
        blockNumber: tx.blockNumber,
        timestamp: receipt ? new Date(Date.now()).toLocaleString() : 'N/A',
        status: receipt?.status ? '成功' : '失败',
        data: decodedData,
        rawData: tx.data
      };

      setQueryResults([result]);
      
      setTimeout(() => {
        hideProgress();
        showToast('✅ 查询完成！', 'success');
      }, 500);
    } catch (error) {
      hideProgress();
      showToast('查询失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGraphQuery = async () => {
    setLoading(true);
    try {
      showProgress('执行 The Graph 查询...');
      updateProgress(1);

      const endpoint = 'https://api.thegraph.com/subgraphs/name/limuran/usdt-data-tracker';
      
      updateProgress(2);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: form.graphqlQuery
        })
      });

      updateProgress(3);
      const result = await response.json();
      
      if (result.errors) {
        throw new Error('GraphQL错误: ' + result.errors.map(e => e.message).join(', '));
      }

      updateProgress(4);
      setQueryResults(result.data);
      
      setTimeout(() => {
        hideProgress();
        showToast('✅ The Graph查询成功！', 'success');
      }, 500);
    } catch (error) {
      hideProgress();
      showToast('The Graph查询失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 查询方式选择 */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveQueryTab('transaction')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            activeQueryTab === 'transaction'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-white'
          }`}
        >
          🔍 交易查询
        </button>
        <button
          onClick={() => setActiveQueryTab('graph')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            activeQueryTab === 'graph'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-white'
          }`}
        >
          📈 The Graph
        </button>
      </div>

      {/* 交易查询 */}
      {activeQueryTab === 'transaction' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-4">🔍 交易数据查询</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">🎡 交易哈希</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.transactionHash}
                  onChange={(e) => setForm(prev => ({ ...prev, transactionHash: e.target.value }))}
                  className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 outline-none font-mono text-sm"
                  placeholder="0x...交易哈希"
                />
                <button
                  onClick={handleTransactionQuery}
                  disabled={loading}
                  className={`bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-all ${
                    loading ? 'opacity-50' : 'hover:bg-indigo-600'
                  }`}
                >
                  {loading ? '查询中...' : '🔍 查询'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The Graph查询 */}
      {activeQueryTab === 'graph' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-4">📈 The Graph 子图查询</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">📊 GraphQL 查询</label>
              <textarea
                value={form.graphqlQuery}
                onChange={(e) => setForm(prev => ({ ...prev, graphqlQuery: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none h-40 font-mono text-sm"
                placeholder="输入GraphQL查询..."
              />
            </div>
            
            <button
              onClick={handleGraphQuery}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {loading ? '🔄 查询中...' : '▶️ 执行 GraphQL 查询'}
            </button>
          </div>
        </div>
      )}

      {/* 查询结果表格 */}
      {queryResults && (
        <TransactionTable 
          data={queryResults} 
          onClose={() => setQueryResults(null)}
        />
      )}
    </div>
  );
};

export default DataQuery;