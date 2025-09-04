import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { ethers } from 'ethers';
import TransactionTable from '../ui/TransactionTable';
import { QUERY_TEMPLATES } from '../../utils/constants';

const DataQuery = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const [activeQueryTab, setActiveQueryTab] = useState('transaction');
  const [loading, setLoading] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [form, setForm] = useState({
    transactionHash: '',
    graphqlQuery: QUERY_TEMPLATES.RECENT_DATA,
    userAddress: '',
    dataType: ''
  });

  // 改进的数据解码函数
  const decodeTransactionData = (data) => {
    if (!data || data === '0x') {
      return '无数据';
    }

    try {
      // 检查是否是 DataStorage.storeData 调用
      if (data.startsWith('0x4ece5b4c')) {
        // storeData(string,string) 的方法签名
        const iface = new ethers.Interface([
          'function storeData(string data, string dataType)'
        ]);
        
        try {
          const decoded = iface.parseTransaction({ data });
          const [dataParam, dataTypeParam] = decoded.args;
          
          return `📝 数据存储调用:
📊 数据内容: ${dataParam}
🏷️ 数据类型: ${dataTypeParam}`;
        } catch (e) {
          console.log('Failed to decode as storeData:', e);
        }
      }

      // 尝试解码为UTF-8文本
      if (data.length > 2) {
        try {
          const decoded = ethers.toUtf8String(data);
          if (decoded && decoded.trim()) {
            return `📝 文本内容: ${decoded}`;
          }
        } catch (e) {
          // UTF-8解码失败，继续其他方法
        }
      }

      // 显示十六进制数据摘要
      const byteLength = (data.length - 2) / 2;
      return `🔢 十六进制数据 (${byteLength} 字节): ${data.slice(0, 42)}${data.length > 42 ? '...' : ''}`;
      
    } catch (error) {
      console.error('数据解码错误:', error);
      return `❌ 解码失败: ${data.slice(0, 42)}...`;
    }
  };

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
      
      // 获取区块信息来获取时间戳
      let blockTime = 'N/A';
      if (tx.blockNumber) {
        try {
          const block = await provider.getBlock(tx.blockNumber);
          blockTime = new Date(block.timestamp * 1000).toLocaleString();
        } catch (e) {
          console.warn('获取区块时间失败:', e);
        }
      }

      const result = [{
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value || 0),
        gasUsed: receipt?.gasUsed?.toString() || 'N/A',
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : 'N/A',
        blockNumber: tx.blockNumber,
        timestamp: blockTime,
        status: receipt?.status || 0,
        data: decodeTransactionData(tx.data),
        rawData: tx.data
      }];

      setQueryResults(result);
      
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

      // 修复子图端点URL - 您需要替换为实际的子图URL
      const endpoint = process.env.REACT_APP_GRAPH_API_URL || 
        'https://api.studio.thegraph.com/query/YOUR_QUERY_ID/usdt-data-tracker/version/latest';
      
      updateProgress(2);
      
      // 准备变量
      const variables = {};
      if (form.userAddress && form.graphqlQuery.includes('$user')) {
        variables.user = form.userAddress;
      }
      if (form.dataType && form.graphqlQuery.includes('$dataType')) {
        variables.dataType = form.dataType;
      }

      console.log('GraphQL Query:', form.graphqlQuery);
      console.log('Variables:', variables);
      console.log('Endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: form.graphqlQuery,
          variables: variables
        })
      });

      updateProgress(3);
      const result = await response.json();
      
      console.log('GraphQL Response:', result);
      
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
      console.error('GraphQL Error Details:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新增：诊断查询函数
  const runDiagnosticQuery = async () => {
    const diagnosticQuery = `
      query DiagnosticQuery {
        _meta {
          block {
            number
            timestamp
          }
          deployment
        }
        dataStorageContracts {
          id
          totalEntries
          deploymentBlock
          deploymentTime
        }
        users(first: 5) {
          id
          totalEntries
        }
        dataEntries(first: 1) {
          id
          userAddress
          data
        }
      }
    `;
    
    setForm(prev => ({ ...prev, graphqlQuery: diagnosticQuery }));
    showToast('🔧 运行诊断查询...', 'info');
  };

  const loadTemplate = (templateKey) => {
    setForm(prev => ({ 
      ...prev, 
      graphqlQuery: QUERY_TEMPLATES[templateKey],
      // 清空变量
      userAddress: '',
      dataType: ''
    }));
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
                  placeholder="0x...交易哈希 (66个字符)"
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
              <p className="text-xs text-gray-500 mt-1">
                💡 交易哈希是以0x开头的66个字符，不是合约地址(42个字符)
              </p>
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
              <label className="block text-sm font-medium mb-2">📝 查询模板</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => loadTemplate('RECENT_DATA')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium"
                >
                  📊 最新数据
                </button>
                <button
                  onClick={() => loadTemplate('ALL_USERS')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium"
                >
                  👥 所有用户
                </button>
                <button
                  onClick={() => loadTemplate('USER_TRANSFERS')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium"
                >
                  👤 用户数据
                </button>
                <button
                  onClick={() => loadTemplate('DATA_BY_TYPE')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium"
                >
                  🏷️ 按类型查询
                </button>
                <button
                  onClick={runDiagnosticQuery}
                  className="col-span-2 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-sm font-medium"
                >
                  🔧 诊断查询 (检查子图状态)
                </button>
              </div>
            </div>

            {/* 查询参数输入 */}
            {form.graphqlQuery.includes('$user') && (
              <div>
                <label className="block text-sm font-medium mb-2">👤 用户地址</label>
                <input
                  type="text"
                  value={form.userAddress}
                  onChange={(e) => setForm(prev => ({ ...prev, userAddress: e.target.value }))}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none font-mono text-sm"
                  placeholder="0x...用户地址"
                />
              </div>
            )}

            {form.graphqlQuery.includes('$dataType') && (
              <div>
                <label className="block text-sm font-medium mb-2">🏷️ 数据类型</label>
                <input
                  type="text"
                  value={form.dataType}
                  onChange={(e) => setForm(prev => ({ ...prev, dataType: e.target.value }))}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none text-sm"
                  placeholder="例如: user_data"
                />
              </div>
            )}
            
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