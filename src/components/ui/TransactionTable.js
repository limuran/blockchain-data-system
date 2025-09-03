import React, { useState } from 'react';
import { ExternalLink, Copy, Eye, X } from 'lucide-react';

const TransactionTable = ({ data, onClose }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.log('复制失败:', e);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatData = (data, maxLength = 30) => {
    if (!data) return 'N/A';
    if (data.length <= maxLength) return data;
    return data.slice(0, maxLength) + '...';
  };

  const getExplorerUrl = (hash) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  const renderTransactionRows = () => {
    if (Array.isArray(data)) {
      return data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-50 border-b">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{formatAddress(item.hash)}</span>
              <button onClick={() => copyToClipboard(item.hash)} className="text-gray-400 hover:text-blue-500">
                <Copy size={14} />
              </button>
              <a href={getExplorerUrl(item.hash)} target="_blank" className="text-blue-500">
                <ExternalLink size={14} />
              </a>
            </div>
          </td>
          <td className="px-4 py-3 text-sm">{formatAddress(item.from)}</td>
          <td className="px-4 py-3 text-sm">{formatAddress(item.to)}</td>
          <td className="px-4 py-3 text-sm">{item.value} ETH</td>
          <td className="px-4 py-3 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs ${
              item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {item.status === 1 ? '✅ 成功' : '❌ 失败'}
            </span>
          </td>
          <td className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span>{formatData(item.data)}</span>
              {item.data && (
                <button
                  onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                  className="text-blue-500"
                >
                  <Eye size={14} />
                </button>
              )}
            </div>
            {expandedRow === index && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all max-w-xs">
                {item.data}
              </div>
            )}
          </td>
        </tr>
      ));
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h4 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="mr-2">📋</span>查询结果
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">交易哈希</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">发送方</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">接收方</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">金额</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">数据</th>
            </tr>
          </thead>
          <tbody>
            {renderTransactionRows()}
          </tbody>
        </table>
      </div>

      {!data || (Array.isArray(data) && data.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p>暂无数据</p>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;