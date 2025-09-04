# 🚀 Hardhat 部署指南 - 部署到真实的 Sepolia 测试网

## ⚡ 快速部署步骤

### 第一步：环境准备 (3分钟)

```bash
# 1. 克隆并进入项目
git clone https://github.com/limuran/blockchain-data-system.git
cd blockchain-data-system

# 2. 安装依赖
npm install
```

### 第二步：配置环境变量 (2分钟)

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑 .env 文件，填入以下信息：
```

**需要的信息**：
- **Infura API Key**: 从 https://infura.io 注册获取
- **私钥**: 从 MetaMask 导出您的私钥（测试钱包）
- **Etherscan API Key**: 从 https://etherscan.io/apis 获取（可选，用于验证）

**示例 .env 文件**：
```env
INFURA_API_KEY=a1b2c3d4e5f6789012345678901234567
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
ETHERSCAN_API_KEY=ABC123DEF456GHI789JKL012MNO345PQR678STU
```

### 第三步：部署合约 (1分钟)

```bash
# 1. 编译合约
npm run compile

# 2. 部署到 Sepolia 测试网
npm run deploy-sepolia
```

## 🎯 预期输出

成功部署后，您应该看到：

```bash
🚀 开始部署 DataStorage 合约...
📍 部署者地址: 0x0F07CdFa12e37cB52f88CDdBE06Db475cf89f423
💰 账户余额: 0.1234567890123456
✅ DataStorage 合约部署成功!
📍 合约地址: 0x[新的合约地址]
🔗 区块浏览器: https://sepolia.etherscan.io/address/0x[新的合约地址]
🔍 验证合约功能...
📊 初始数据计数: 0
📝 存储测试数据...
✅ 测试数据存储成功，新计数: 1
📋 部署信息已保存到 deployment-info.json
```

## 🔍 验证部署成功

### 1. 检查 Etherscan
访问输出的区块浏览器链接，应该看到：
- ✅ 合约创建交易
- ✅ **有 "Logs" 标签** - 显示 `ContractDeployed` 事件
- ✅ **有 storeData 交易的 "Logs"** - 显示 `DataStored` 事件

### 2. 检查部署信息
项目根目录会生成 `deployment-info.json`：
```json
{
  "contractAddress": "0x...",
  "deployerAddress": "0x...",
  "network": "Sepolia",
  "deploymentTime": "2025-09-04T...",
  "explorerUrl": "https://sepolia.etherscan.io/address/0x..."
}
```

## 🛠️ 常见问题解决

### 问题1: "insufficient funds for intrinsic transaction cost"
```bash
# 解决：需要 Sepolia ETH
# 访问：https://sepoliafaucet.com/
# 或者：https://faucets.chain.link/sepolia
```

### 问题2: "invalid project id"
```bash
# 检查 .env 中的 INFURA_API_KEY 是否正确
```

### 问题3: "nonce has already been used"
```bash
# 重置 MetaMask 账户：
# 设置 -> 高级 -> 清除活动标签数据
```

## 🚀 部署成功后的下一步

1. **记录新合约地址**
2. **更新子图配置**（我会帮您做）
3. **更新前端配置**
4. **测试完整流程**

---

**立即开始**：
1. 设置 `.env` 文件
2. 运行 `npm run deploy-sepolia`
3. 告诉我新的合约地址！