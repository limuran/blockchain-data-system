# 🚀 区块链数据系统 v2.0

现代化的多链区块链数据存储和查询系统，支持以太坊生态多个网络。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Compatible-purple.svg)](https://ethereum.org/)

## ✨ 主要特性

- 🌐 **多链支持**: Sepolia、以太坊主网、BSC、Polygon等
- 👤 **ENS集成**: 自动解析ENS名称和头像
- ⚡ **真实上链**: 支持ETH转账、代币转账、合约存储
- 🔑 **API配置**: 支持Infura和Alchemy节点服务
- 📝 **任意数据**: 支持中英文混合字符串存储
- 📊 **数据查询**: 交易查询和The Graph子图查询
- 🎨 **现代UI**: 响应式设计，玻璃拟态效果

## 🛠️ 技术栈

- **前端**: React 18 + Webpack 5
- **样式**: Tailwind CSS + 自定义动画
- **区块链**: Ethers.js v6 + MetaMask
- **合约**: Solidity 0.8.19 + Hardhat
- **索引**: The Graph Protocol
- **图标**: Lucide React

## 📦 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/limuran/blockchain-data-system.git
cd blockchain-data-system
git checkout react-webpack-refactor
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境
```bash
cp .env.example .env
# 编辑 .env 文件，添加你的API密钥
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问: http://localhost:3000

## 🔧 配置指南

### API 密钥获取

#### Infura (推荐)
1. 访问 [infura.io](https://infura.io)
2. 注册账户并创建项目
3. 复制 Project ID 到 `REACT_APP_INFURA_API_KEY`

#### Alchemy (可选)
1. 访问 [alchemy.com](https://alchemy.com)
2. 注册账户并创建应用
3. 复制 API Key 到 `REACT_APP_ALCHEMY_API_KEY`

### 合约部署

#### 部署到Sepolia测试网
```bash
# 编译合约
npm run contract:compile

# 运行测试
npm run contract:test

# 部署到Sepolia
npm run contract:deploy
```

## 📋 功能说明

### 🔄 ETH转账携带数据
- 支持0ETH转账（仅携带数据）
- 任意字符串数据上链
- 自动Gas估算

### 🪙 代币转账（USDT）
- 多链USDT支持
- 实时余额查询
- 转账历史记录

### 📝 智能合约存储
- 专用DataStorage合约
- 事件日志永久记录
- The Graph自动索引

### 📊 数据查询
- 交易哈希查询
- GraphQL子图查询
- 结果表格展示

## 🌐 支持的网络

| 网络 | Chain ID | 代币 | 区块浏览器 |
|------|----------|------|----------|
| Sepolia | 11155111 | SepoliaETH | [sepolia.etherscan.io](https://sepolia.etherscan.io) |
| 以太坊主网 | 1 | ETH | [etherscan.io](https://etherscan.io) |
| BSC主网 | 56 | BNB | [bscscan.com](https://bscscan.com) |
| Polygon | 137 | MATIC | [polygonscan.com](https://polygonscan.com) |

## 🏗️ 架构设计

```
├── src/
│   ├── components/          # React组件
│   │   ├── tabs/           # 功能标签页
│   │   ├── wallet/         # 钱包相关
│   │   └── ui/             # 通用UI组件
│   ├── contexts/           # React Context
│   ├── config/             # 配置文件
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── contracts/              # Solidity合约
├── scripts/                # 部署脚本
└── test/                   # 合约测试
```

## 🔗 相关链接

- [在线演示](https://limuran.github.io/blockchain-data-system)
- [合约源码](./contracts/DataStorage.sol)
- [API文档](./docs/API.md)
- [部署指南](./DEPLOYMENT.md)
- [架构文档](./ARCHITECTURE.md)

## 🤝 贡献指南

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙏 致谢

- [React](https://reactjs.org/) - UI框架
- [Ethers.js](https://docs.ethers.org/) - 以太坊库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [The Graph](https://thegraph.com/) - 数据索引协议
- [Hardhat](https://hardhat.org/) - 以太坊开发环境

---

**🎯 从3000行单文件到完全模块化的现代架构！**