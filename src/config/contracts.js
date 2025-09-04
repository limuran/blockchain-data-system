// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // DataStorage 合约地址 (已修复 - 包含事件发出)
  DATA_STORAGE: {
    sepolia: '0xaE036c65C649172b43ef7156b009c6221B596B8b', // 新的修复版本
    mainnet: '', // 主网地址 (待部署)
    // 旧版本 (仅存档，不再使用)
    sepolia_old: '0xcD6a42782d230D7c13A74ddec5dD140e55499Df9' // 无事件版本
  },
  
  // 子图端点配置  
  SUBGRAPH_ENDPOINTS: {
    sepolia: 'https://api.studio.thegraph.com/query/YOUR_QUERY_ID/usdt-data-tracker/version/latest',
    mainnet: '' // 主网子图端点 (待配置)
  }
};

// 根据网络获取合约地址
export const getContractAddress = (network = 'sepolia') => {
  return CONTRACT_ADDRESSES.DATA_STORAGE[network];
};

// 根据网络获取子图端点
export const getSubgraphEndpoint = (network = 'sepolia') => {
  return CONTRACT_ADDRESSES.SUBGRAPH_ENDPOINTS[network];
};

// 默认配置
export const DEFAULT_CONTRACT_CONFIG = {
  network: 'sepolia',
  address: CONTRACT_ADDRESSES.DATA_STORAGE.sepolia,
  abi: 'DataStorage', // 引用 constants.js 中的 ABI
  hasEvents: true // 标记新合约支持事件
};

// 合约版本信息
export const CONTRACT_VERSION_INFO = {
  current: {
    address: '0xaE036c65C649172b43ef7156b009c6221B596B8b',
    version: '2.0.0',
    features: ['事件发出', '完整数据存储', '子图兼容'],
    deployedAt: '2025-09-04',
    solidity: '^0.8.30'
  },
  previous: {
    address: '0xcD6a42782d230D7c13A74ddec5dD140e55499Df9',
    version: '1.0.0', 
    issues: ['无事件发出', '子图无法捕获'],
    deprecated: true
  }
};