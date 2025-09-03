# 安装指南

## 🔧 修复依赖版本问题

如果你遇到 ethers 版本冲突错误，请按照以下步骤解决：

### 方法 1: 清理并重新安装

```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 清理 npm 缓存
npm cache clean --force

# 重新安装依赖
npm install
```

### 方法 2: 使用 --legacy-peer-deps 标志

```bash
npm install --legacy-peer-deps
```

### 方法 3: 使用 yarn 替代 npm

```bash
# 安装 yarn
npm install -g yarn

# 使用 yarn 安装依赖
yarn install
```

## 📦 依赖版本说明

本项目已更新到 ethers v6，主要变化：

### ethers v5 → v6 迁移要点

| v5 | v6 |
|----|----|
| `ethers.utils.formatEther()` | `ethers.formatEther()` |
| `contract.deployed()` | `contract.waitForDeployment()` |
| `contract.address` | `await contract.getAddress()` |
| `new ethers.providers.Web3Provider()` | `new ethers.BrowserProvider()` (浏览器) |
| `signer.getBalance()` | `provider.getBalance(signer.address)` |

### 前端 CDN 更新

前端使用的 CDN 已更新到：
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.14.0/ethers.umd.min.js"></script>
```

## 🚀 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/limuran/blockchain-data-system.git
   cd blockchain-data-system
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或使用
   npm install --legacy-peer-deps
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加你的 API 密钥
   ```

4. **编译合约**
   ```bash
   npm run compile
   ```

5. **运行测试**
   ```bash
   npm run test
   ```

6. **部署到测试网**
   ```bash
   npm run deploy:sepolia
   ```

## ⚠️ 常见问题

### Q: npm install 失败
A: 尝试使用 `npm install --legacy-peer-deps` 或切换到 yarn

### Q: 前端连接钱包失败
A: 确保使用的是 ethers v6 语法，检查浏览器开发者工具的错误信息

### Q: 合约部署失败
A: 检查 .env 文件中的网络配置和私钥设置

### Q: 测试失败
A: 确保 Hardhat 网络正常运行，重新编译合约后再运行测试

## 📞 获取帮助

如果遇到问题，请：

1. 检查 [Issues](https://github.com/limuran/blockchain-data-system/issues)
2. 创建新的 Issue 描述问题
3. 提供错误日志和环境信息