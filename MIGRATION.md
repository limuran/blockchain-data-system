# 🔄 迁移指南

## 从 v1.0 迁移到 v2.0

### 📊 主要变化

1. **架构重构**
   - 从 3000行单文件 → 模块化组件
   - 从 HTML + Script → React + Webpack
   - 从全局状态 → Context 管理

2. **功能增强**
   - ✅ 多链切换支持
   - ✅ ENS昵称和头像
   - ✅ 真实交易上链
   - ✅ 任意字符串数据
   - ✅ 数据查询表格
   - ✅ API密钥配置

3. **合约改进**
   - ✅ 添加 constructor
   - ✅ 更多事件日志
   - ✅ 数据哈希索引
   - ✅ 查询优化

### 🚀 迁移步骤

#### 1. 备份现有数据
```bash
# 备份 v1.0 配置
cp frontend/react-complete.html frontend/react-complete.html.bak
cp .env .env.bak  # 如果存在
```

#### 2. 切换到新分支
```bash
git fetch origin
git checkout react-webpack-refactor
npm install
```

#### 3. 迁移配置
```bash
# 从备份中复制API密钥
cp .env.example .env
# 手动添加你的API密钥
```

#### 4. 测试新版本
```bash
npm run dev
```

#### 5. 迁移合约数据
如果你在v1.0中已经部署了合约：
- 在新版本的“合约存储”标签页中输入合约地址
- 或者重新部署新版本合约（推荐）

### 🔍 验证清单

- [ ] 钱包连接正常
- [ ] ENS名称和头像显示
- [ ] 网络切换功能
- [ ] ETH转账携带中文数据
- [ ] USDT转账功能
- [ ] 合约数据存储
- [ ] 交易查询表格
- [ ] The Graph查询

### 🐛 常见问题

#### Q1: 无法连接MetaMask
A: 确保在HTTPS或localhost环境下访问

#### Q2: 网络切换失败
A: 检查MetaMask中是否已添加对应网络

#### Q3: 交易失败
A: 检查ETH余额是否充足支付Gas费用

#### Q4: The Graph查询无数据
A: 确保子图已部署并索引了数据

### 🔗 有用链接
- [React 文档](https://react.dev)
- [Ethers.js 文档](https://docs.ethers.org)
- [Webpack 文档](https://webpack.js.org)
- [Tailwind CSS](https://tailwindcss.com)
- [The Graph](https://thegraph.com/docs)