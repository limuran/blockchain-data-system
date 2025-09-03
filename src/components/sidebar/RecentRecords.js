import React from 'react';
import { ExternalLink } from 'lucide-react';

const RecentRecords = ({ records }) => {
  const getExplorerUrl = (hash) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  const formatData = (data, maxLength = 20) => {
    if (!data) return '暂无数据';
    if (data.length <= maxLength) return data;
    return data.slice(0, maxLength) + '...';
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <span className="mr-2">📋</span>最新记录
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {records.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">暂无数据记录</p>
            <p className="text-xs mt-1">开始使用功能创建记录</p>
          </div>
        ) : (
          records.map((record, i) => (
            <div
              key={record.id || i}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{record.type}</h4>
                <span className="text-xs text-gray-500">{record.time}</span>
              </div>
              
              <p className="text-xs text-gray-600 mb-2 break-all">
                {formatData(record.data, 40)}
              </p>
              
              {record.amount && (
                <p className="text-xs text-blue-600 font-medium mb-1">
                  {record.amount}
                </p>
              )}
              
              <div className="flex justify-between text-xs items-center">
                <span>Gas: {parseInt(record.gasUsed || 0).toLocaleString()}</span>
                <a
                  href={getExplorerUrl(record.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1"
                >
                  查看 <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentRecords;