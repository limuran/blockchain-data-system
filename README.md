# 区块链数据上链系统 v2.0

🚀 **React + Webpack架构重构版** - 解决所有问题，支持多链切换、ENS展示、任意字符串上链

## ✨ 新版本亮点

### ✅ 已解决问题
1. **支持多链切换** - 支持Sepolia、主网、BSC等
2. **ENS昵称和头像展示** - 完整的ENS集成
3. **真实交易上链** - 修复转账和合约功能
4. **API密钥配置** - 支持Alchemy和Infura
5. **任意字符串支持** - 不再限制JSON格式
6. **完整constructor** - 合约添加初始化函数
7. **表格化数据展示** - 交易查询结果表格

### 🎨 新架构特性
- 🧩 **模块化设计** - React组件化架构
- 🔄 **Context管理** - 钱包和交易状态管理
- ⚡ **性能优化** - Webpack打包优化
- 🌐 **多链支持** - 灵活的网络切换
- 📊 **数据表格** - 丰富的查询结果展示

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，添加你的API密钥
```

### 3. 启动开发服务器
```bash
npm run dev
# 或
npm start
```

### 4. 构建生产版本
```bash
npm run build
```

## 📊 功能特性

### 💰 ETH转账数据上链
- 支持18位精度，可以0ETH转账
- 任意字符串数据嵌入data字段
- 支持中文、英文、特殊字符

### 🪙 代币转账
- USDT/USDC/DAI等ERC20代币支持
- 自动余额查询和Gas估算
- 关联任意数据字符串

### 📝 合约数据存储
- 一键部署DataStorage合约
- 事件日志永久存储
- The Graph自动索引

### 🔍 数据查询表格
- 交易哈希查询
- The Graph GraphQL查询
- 表格化结果展示
- 数据复制和导出

## 🌐 支持网络
- **Sepolia测试网** (推荐)
- 以太坊主网
- BSC主网
- 更多网络可配置...

## 📁 项目结构
```
src/
├── components/          # React组件
│   ├── tabs/            # 主功能标签页
│   ├── wallet/          # 钱包相关组件
│   ├── sidebar/         # 侧边栏组件
│   └── ui/              # 通用UI组件
├── contexts/            # React Context
├── config/              # 配置文件
├── styles/              # 样式文件
└── utils/               # 工具函数
```

## 🔧 开发指南

### 环境变量配置
在 `.env` 文件中配置你的API密钥：

```env
REACT_APP_INFURA_API_KEY=your_infura_key
REACT_APP_ALCHEMY_API_KEY=your_alchemy_key
```

### 新增网络支持
在 `src/config/networks.js` 中添加新网络配置。

## 📊 技术栈
- **前端**: React 18, Webpack 5, Tailwind CSS
- **区块链**: Ethers.js v6, MetaMask
- **数据查询**: The Graph, GraphQL
- **UI组件**: Lucide React
- **状态管理**: React Context

## 📝 使用说明

1. **连接钱包** - 点击“连接钱包”按钮
2. **切换网络** - 点击网络指示器选择网络
3. **上链数据** - 选择ETH转账、代币转账或合约存储
4. **查询数据** - 使用交易哈希或The Graph查询

## 🔗 相关链接
- [The Graph 子图](https://api.thegraph.com/subgraphs/name/limuran/usdt-data-tracker)
- [Sepolia 测试网](https://sepolia.etherscan.io)
- [MetaMask 钱包](https://metamask.io)

## 🐛 问题反馈
如有问题请在 GitHub Issues 中反馈。

---

**由 @limuran 开发** | **MIT License**