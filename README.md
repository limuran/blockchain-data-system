# 区块链数据上链系统

一个完整的区块链数据存储和查询系统，支持直接转账和智能合约两种数据上链方式，集成 The Graph 进行数据索引和查询。

## 🚀 功能特性

### 核心功能
- **直接转账上链**: 通过 ETH/USDT 转账将数据编码到交易中
- **合约数据存储**: 使用智能合约存储结构化数据
- **多重查询方式**: 支持 Etherscan API、Infura、Alchemy、The Graph 查询
- **ENS 集成**: 支持 ENS 名称和头像显示
- **实时监控**: 合约事件实时监控和数据统计

### 技术栈
- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **智能合约**: Solidity ^0.8.19
- **开发框架**: Hardhat
- **区块链交互**: Ethers.js v6
- **数据索引**: The Graph Protocol
- **测试网络**: Sepolia, Goerli, Mumbai
- **数字处理**: BigNumber.js

## 📦 项目结构

```
blockchain-data-system/
├── contracts/
│   └── DataStorage.sol          # 数据存储合约
├── scripts/
│   ├── deploy-complete.js       # 完整部署脚本
│   ├── interact.js             # 合约交互脚本
│   ├── verify-contract.js      # 合约验证脚本
│   └── monitor.js              # 事件监控脚本
├── test/
│   └── DataStorage.test.js     # 合约测试
├── subgraph/
│   ├── subgraph.yaml           # 子图配置
│   ├── schema.graphql          # GraphQL 模式
│   └── src/data-storage.ts     # 索引逻辑
├── frontend/
│   └── index.html              # 前端界面
├── deployments/                # 部署记录
├── hardhat.config.js          # Hardhat 配置
├── package.json               # 项目依赖
└── README.md                  # 项目文档
```

## 🛠️ 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/limuran/blockchain-data-system.git
cd blockchain-data-system

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

### 2. 环境变量配置

创建 `.env` 文件并配置以下变量：

```bash
# 网络配置
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key

# 账户配置
PRIVATE_KEY=your_private_key_without_0x_prefix
MNEMONIC=your_twelve_word_mnemonic_phrase

# API 密钥
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# The Graph
THE_GRAPH_ACCESS_TOKEN=your_graph_access_token
SUBGRAPH_ENDPOINT=your_subgraph_endpoint
```

### 3. 编译和测试

```bash
# 编译合约
npm run compile

# 运行测试
npm run test

# 生成测试覆盖率报告
npm run coverage

# 生成 Gas 使用报告
npm run gas-report
```

### 4. 部署合约

```bash
# 部署到 Sepolia 测试网
npm run deploy:sepolia

# 部署到 Goerli 测试网
npm run deploy:goerli

# 验证合约
npm run verify
```

### 5. 配置 The Graph

```bash
# 初始化子图项目
graph init --studio your-subgraph-name

# 生成代码
npm run subgraph:codegen

# 构建子图
npm run subgraph:build

# 部署子图
npm run subgraph:deploy
```

## 🔧 详细配置

### 智能合约部署

合约会自动部署到指定网络，并生成以下文件：
- `deployments/{network}-deployment.json`: 部署信息
- `frontend-config.json`: 前端配置
- `subgraph-generated.yaml`: 子图配置

### 前端配置

部署完成后，更新前端 HTML 文件中的配置：

```javascript
// 更新合约地址
const CONTRACT_ADDRESS = "0x..."; // 从 frontend-config.json 获取

// 更新 RPC 端点
const INFURA_PROJECT_ID = "your_project_id";
const ALCHEMY_API_KEY = "your_api_key";

// 更新子图端点
const SUBGRAPH_ENDPOINT = "your_subgraph_endpoint";
```

## 📊 使用指南

### 1. 连接钱包

- 点击"连接钱包"按钮
- 确认 MetaMask 连接
- 系统会自动检测和显示 ENS 信息

### 2. 直接转账上链

**ETH 转账方式：**
```javascript
// 编码数据到交易
const data = "Hello Blockchain";
const encodedData = ethers.utils.hexlify(
  ethers.utils.toUtf8Bytes(data)
);

await signer.sendTransaction({
  to: targetAddress,
  value: ethers.utils.parseEther("0.001"),
  data: encodedData
});
```

**USDT 转账方式：**
```javascript
// 使用 ERC20 合约转账
const usdtContract = new ethers.Contract(
  USDT_ADDRESS, USDT_ABI, signer
);

await usdtContract.transfer(
  targetAddress, 
  ethers.utils.parseUnits("1.0", 6) // USDT 使用 6 位小数
);
```

### 3. 合约数据存储

```javascript
// 连接到数据存储合约
const contract = new ethers.Contract(
  CONTRACT_ADDRESS, CONTRACT_ABI, signer
);

// 存储单条数据
await contract.storeData("数据内容", "数据类型");

// 批量存储数据
await contract.storeMultipleData(
  ["数据1", "数据2"], 
  ["类型1", "类型2"]
);
```

### 4. 数据查询

**使用 The Graph 查询：**
```graphql
query GetLatestData {
  dataEntries(
    first: 10
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    data
    timestamp
    user {
      address
    }
    dataType {
      name
    }
  }
}
```

## 🔍 监控和维护

### 实时监控

```bash
# 启动合约事件监控
npm run monitor
```

监控功能包括：
- 新数据存储事件
- 新用户注册事件
- Gas 使用统计
- 实时数据统计

### 合约交互

```bash
# 与已部署的合约交互
npm run interact
```

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npx hardhat test test/DataStorage.test.js

# 运行测试并生成覆盖率报告
npm run coverage
```

## 📈 性能优化

### Gas 优化

1. **批量操作**: 使用 `storeMultipleData` 批量存储数据
2. **数据压缩**: 对 JSON 数据进行压缩
3. **事件索引**: 合理使用 `indexed` 参数

### 查询优化

1. **The Graph**: 使用子图进行复杂查询
2. **缓存策略**: 实现前端数据缓存
3. **分页查询**: 避免一次性查询大量数据

## 🛡️ 安全考虑

### 合约安全

- ✅ 使用最新的 Solidity 版本
- ✅ 完整的单元测试覆盖
- ✅ Gas 限制和溢出检查
- ✅ 事件日志记录

### 前端安全

- ✅ 输入验证和清理
- ✅ 私钥安全管理
- ✅ HTTPS 通信
- ✅ 跨站脚本防护

## 🔄 升级路径

### 合约升级

项目支持以下升级策略：
1. **代理合约模式**: 使用 OpenZeppelin 升级插件
2. **数据迁移**: 提供数据迁移脚本
3. **版本控制**: 完整的版本管理

### 功能扩展

未来可以扩展的功能：
- 数据加密存储
- 多链支持
- NFT 集成
- DeFi 协议集成

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 遵循 Solidity 最佳实践
- 添加完整的测试用例
- 更新相关文档

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Hardhat](https://hardhat.org/) - 以太坊开发环境
- [The Graph](https://thegraph.com/) - 去中心化索引协议
- [OpenZeppelin](https://openzeppelin.com/) - 智能合约库
- [Ethers.js](https://ethers.org/) - 以太坊库

## 📞 支持

如果您遇到问题或有疑问，请：

1. 查看现有的 [Issues](../../issues)
2. 创建新的 Issue
3. 联系开发团队

## 🌟 演示

🔗 **在线演示**: [https://limuran.github.io/blockchain-data-system/frontend](https://limuran.github.io/blockchain-data-system/frontend)

📊 **The Graph 子图**: [您的子图链接](https://api.studio.thegraph.com/query/your-subgraph-id/usdt-data-tracker/version/latest)

---

**Happy Building! 🚀**