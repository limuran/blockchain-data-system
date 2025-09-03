# 🏠 架构设计文档

## 📊 整体架构

```
区块链数据系统 v2.0
┌───────────────────────────────────┐
│          React 前端应用                    │
├───────────────────────────────────┤
│ 👛 WalletContext  │ 📊 TransactionContext │
├─────────────────┬─────────────────┤
│  钱包管理       │    交易记录          │
│  ENS 解析       │    统计信息          │
│  网络切换       │    合约地址          │
└─────────────────┴─────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│           主组件层                     │
├─────────┬───────────┬─────────────┤
│ Header  │ MainContent │ Sidebar   │
├─────────┼───────────┼─────────────┤
│ 钱包组件 │ 功能标签页  │ 统计面板 │
│ 网络指示 │ ETH转账    │ API状态  │
│         │ 代币转账    │ 最新记录 │
│         │ 合约存储    │         │
│         │ 数据查询    │         │
└─────────┴───────────┴─────────────┘
```

## 📁 文件结构

```
src/
├── components/             # React组件
│   ├── Header.js           # 头部组件
│   ├── MainContent.js      # 主内容区
│   ├── Sidebar.js          # 侧边栏
│   ├── tabs/               # 功能标签页
│   │   ├── EthTransfer.js  # ETH转账
│   │   ├── TokenTransfer.js # 代币转账
│   │   ├── ContractStorage.js # 合约存储
│   │   └── DataQuery.js    # 数据查询
│   ├── wallet/             # 钱包相关
│   │   ├── WalletButton.js # 钱包按钮
│   │   └── NetworkIndicator.js # 网络指示器
│   ├── sidebar/            # 侧边栏组件
│   │   ├── StatsPanel.js   # 统计面板
│   │   ├── ApiStatus.js    # API状态
│   │   └── RecentRecords.js # 最新记录
│   └── ui/                 # 通用UI组件
│       ├── Toast.js        # 消息提示
│       ├── Progress.js     # 进度条
│       └── TransactionTable.js # 交易表格
├── contexts/               # React Context
│   ├── WalletContext.js    # 钱包状态管理
│   └── TransactionContext.js # 交易状态管理
├── config/                 # 配置文件
│   └── networks.js         # 网络配置
├── utils/                  # 工具函数
│   ├── blockchain.js       # 区块链工具
│   └── constants.js        # 常量定义
├── styles/                 # 样式文件
│   ├── index.css          # 全局样式
│   └── App.css            # 应用样式
└── index.js               # 入口文件
```

## 🔄 数据流设计

### 钱包状态流
```
MetaMask 连接 → WalletContext → 更新余额 → UI组件刷新
     ↓
网络切换检测 → 更新网络信息 → 重新查询代币余额
     ↓
ENS解析 → 获取头像 → 更新显示名称
```

### 交易状态流
```
用户操作 → 验证输入 → 调用区块链 → 等待确认 → 更新记录
    ↓
显示进度条 → 更新进度 → 成功/失败提示 → 添加到记录列表
```

## 🧩 组件设计原则

### 1. 单一职责
- 每个组件只负责一个功能
- 钱包组件只处理钱包相关逻辑
- 交易组件只处理交易逻辑

### 2. 状态提升
- 全局状态通过Context管理
- 组件间通过props传递必要数据
- 避免deep prop drilling

### 3. 错误边界
- 每个主要组件都有错误处理
- 用户友好的错误提示
- 日志记录用于调试

## 🔌 集成服务

### MetaMask 集成
```javascript
// 监听钱包事件
window.ethereum.on('accountsChanged', handleAccountChange);
window.ethereum.on('chainChanged', handleChainChange);

// 请求连接
const accounts = await window.ethereum.request({
  method: 'eth_requestAccounts'
});
```

### Ethers.js 集成
```javascript
// 创建Provider
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 合约调用
const contract = new ethers.Contract(address, abi, signer);
const tx = await contract.storeData(data, dataType);
```

### The Graph 集成
```javascript
// GraphQL查询
const response = await fetch(graphEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: graphqlQuery })
});
```

## 🎯 核心功能实现

### 1. 多链支持
- 网络配置集中管理
- 动态RPC切换
- 代币合约地址映射

### 2. 数据上链方式

#### 方式1: ETH转账携带数据
```javascript
const tx = await signer.sendTransaction({
  to: targetAddress,
  value: ethers.parseEther(amount),
  data: ethers.hexlify(ethers.toUtf8Bytes(stringData))
});
```

#### 方式2: 代币转账关联数据
```javascript
const contract = new ethers.Contract(tokenAddress, erc20Abi, signer);
const tx = await contract.transfer(to, amount);
// 数据通过交易哈希和时间戳关联
```

#### 方式3: 智能合约事件存储
```javascript
const dataContract = new ethers.Contract(contractAddress, dataStorageAbi, signer);
const tx = await dataContract.storeData(data, dataType);
// 触发 DataStored 事件
```

### 3. 数据查询

#### 链上直接查询
```javascript
const tx = await provider.getTransaction(hash);
const receipt = await provider.getTransactionReceipt(hash);
const decodedData = ethers.toUtf8String(tx.data);
```

#### The Graph 子图查询
```graphql
query GetUserData($user: String!) {
  dataStoreds(
    where: { user: $user }
    orderBy: timestamp
    orderDirection: desc
  ) {
    id user data dataType timestamp blockNumber
  }
}
```

## 🛡️ 安全考虑

### 1. 输入验证
- 地址格式验证
- 金额范围检查
- 数据长度限制

### 2. 错误处理
- Try-catch包装所有异步操作
- 用户友好的错误信息
- 日志记录便于调试

### 3. 权限控制
- 钱包连接状态检查
- 网络兼容性验证
- 余额充足性检查

## ⚡ 性能优化

### 1. React优化
- 使用React.memo防止不必要重渲染
- useCallback和useMemo优化计算
- 组件懒加载

### 2. 网络优化
- API调用防抖
- 缓存ENS查询结果
- 批量查询优化

### 3. 构建优化
- Webpack代码分割
- CSS提取和压缩
- 图片资源优化

## 🔮 扩展性设计

### 新增网络支持
1. 在 `networks.js` 添加网络配置
2. 配置代币合约地址
3. 更新区块浏览器URL

### 新增功能模块
1. 创建新的标签页组件
2. 在 `MainContent.js` 注册
3. 添加相应的状态管理

### API服务扩展
1. 在 `utils/` 添加API封装
2. 在组件中调用API服务
3. 添加错误处理和重试逻辑

这个架构设计确保了代码的可维护性、可扩展性和性能优化。