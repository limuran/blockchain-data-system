// 常用常数定义

export const APP_CONFIG = {
  APP_NAME: '区块链数据上链系统',
  VERSION: '2.0.0',
  GITHUB_URL: 'https://github.com/limuran/blockchain-data-system',
  DEFAULT_GAS_LIMIT: 100000,
  MAX_DATA_LENGTH: 10000, // 最大数据长度
  TOAST_DURATION: 3500,
  TRANSACTION_CONFIRMATIONS: 1
};

export const DATA_TYPES = {
  USER_DATA: 'user_data',
  TRANSACTION_LOG: 'transaction_log',
  SYSTEM_EVENT: 'system_event',
  BUSINESS_DATA: 'business_data',
  AUDIT_LOG: 'audit_log',
  CUSTOM: 'custom'
};

export const TRANSACTION_TYPES = {
  ETH_TRANSFER: 'eth_transfer',
  TOKEN_TRANSFER: 'token_transfer',
  CONTRACT_CALL: 'contract_call'
};

export const QUERY_TEMPLATES = {
  RECENT_DATA: `query GetRecentData {
  dataStoreds(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user
    data
    dataType
    timestamp
    blockNumber
    transactionHash
  }
}`,
  USER_TRANSFERS: `query GetUserTransfers($user: String!) {
  transfers(where: {or: [{from: $user}, {to: $user}]}, first: 10) {
    id
    from
    to
    value
    timestamp
    transactionHash
  }
}`,
  DATA_BY_TYPE: `query GetDataByType($dataType: String!) {
  dataStoreds(where: {dataType: $dataType}, first: 10) {
    id
    user
    data
    timestamp
    dataHash
  }
}`
};

export const CONTRACT_ABIS = {
  ERC20: [
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)',
    'function name() external view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ],
  // 简化的DataStorage ABI，只包含基本函数
  DATA_STORAGE: [
    'function storeData(string data, string dataType) external',
    'function getDataCount() external view returns (uint256)',
    'function getUserData(address user) external view',
    'function getLatestData(uint256 count) external view', 
    'function getDataByType(string dataType) external view',
    'function owner() external view returns (address)',
    'event DataStored(address indexed user, string data, uint256 timestamp, string indexed dataType, uint256 indexed entryId, uint256 blockNumber, bytes32 dataHash)',
    'event ContractDeployed(address indexed deployer, uint256 timestamp, uint256 blockNumber)'
  ],
  // Remix兼容的ABI格式
  DATA_STORAGE_REMIX: [
    'function storeData(string,string)',
    'function getDataCount() view returns (uint256)', 
    'function owner() view returns (address)'
  ]
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: '请先连接钱包',
  INVALID_ADDRESS: '请输入有效的以太坊地址',
  INSUFFICIENT_BALANCE: '余额不足',
  TRANSACTION_FAILED: '交易失败',
  NETWORK_ERROR: '网络错误',
  CONTRACT_ERROR: '合约调用失败',
  INVALID_DATA: '无效的数据格式'
};

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: '钱包连接成功',
  TRANSACTION_SUCCESS: '交易成功',
  CONTRACT_DEPLOYED: '合约部署成功',
  DATA_STORED: '数据存储成功',
  QUERY_SUCCESS: '查询成功'
};