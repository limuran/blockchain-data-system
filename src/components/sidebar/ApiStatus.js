import React, { useState, useEffect } from 'react';

const ApiStatus = () => {
  const [apiStatuses, setApiStatuses] = useState([
    { name: 'Ethers.js', status: '已加载', color: 'green' },
    { name: 'The Graph', status: '已连接', color: 'green' },
    { name: 'Infura API', status: '未配置', color: 'orange' },
    { name: 'Alchemy API', status: '未配置', color: 'orange' }
  ]);

  useEffect(() => {
    // 检查API状态
    const checkApiStatus = () => {
      const hasInfura = process.env.REACT_APP_INFURA_API_KEY;
      const hasAlchemy = process.env.REACT_APP_ALCHEMY_API_KEY;
      
      setApiStatuses(prev => prev.map(api => {
        if (api.name === 'Infura API') {
          return { ...api, status: hasInfura ? '已配置' : '未配置', color: hasInfura ? 'green' : 'orange' };
        }
        if (api.name === 'Alchemy API') {
          return { ...api, status: hasAlchemy ? '已配置' : '未配置', color: hasAlchemy ? 'green' : 'orange' };
        }
        return api;
      }));
    };

    checkApiStatus();
  }, []);

  return (
    <div className="glass rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <span className="mr-2">🌐</span>API状态
      </h3>
      <div className="space-y-3">
        {apiStatuses.map((api) => (
          <div key={api.name} className="flex justify-between items-center">
            <span className="text-sm text-gray-700">{api.name}</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                api.color === 'green'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {api.status}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 在 .env 文件中配置API密钥以启用更多功能
        </p>
      </div>
    </div>
  );
};

export default ApiStatus;