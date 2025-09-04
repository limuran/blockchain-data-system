# 🚀 Hardhat 快速设置指南

## ⚡ 解决 ESM 模块问题

### 问题原因
因为package.json设置了`"type": "module"`，但Hardhat配置文件使用CommonJS格式。

### ✅ 解决方案

#### 方法1: 使用.cjs文件 (推荐)
```bash
# 1. 重命名配置文件
mv hardhat.config.js hardhat.config.cjs

# 2. 使用.cjs版本
cp hardhat.config.cjs hardhat.config.js
cp scripts/deploy-contract.js scripts/deploy-contract.cjs

# 3. 编译合约
npx hardhat compile
```

#### 方法2: 修改package.json
```bash
# 移除ESM设置
npm pkg delete type

# 然后编译
npx hardhat compile
```

## 🎯 推荐流程

### 1. 快速修复
```bash
# 复制.cjs版本的配置
cp hardhat.config.cjs hardhat.config.js
cp scripts/deploy-contract.cjs scripts/deploy-contract.js

# 立即编译
npx hardhat compile
```

### 2. 设置环境变量
```bash
# 创建.env文件
echo "INFURA_API_KEY=your_infura_key" > .env
echo "PRIVATE_KEY=your_private_key" >> .env
echo "ETHERSCAN_API_KEY=your_etherscan_key" >> .env
```

### 3. 本地测试
```bash
# 运行测试
npx hardhat test

# 启动本地网络
npx hardhat node

# 新终端部署到本地
npx hardhat run scripts/deploy-contract.js --network localhost
```

### 4. 部署到Sepolia
```bash
# 确保.env文件配置正确
npx hardhat run scripts/deploy-contract.js --network sepolia
```

## 📋 成功标志

编译成功后会显示:
```
Compiled 1 Solidity file successfully
```

部署成功后会生成:
- `deployment-info.json` - 部署信息
- `artifacts/` - 编译结果
- 完整的合约地址和区块信息