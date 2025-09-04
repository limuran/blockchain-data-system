# 🔍 子图查询问题诊断和修复

## 问题分析
子图查询返回 `{"data":{"dataEntries":[]}}` 说明：
1. ✅ 子图部署成功
2. ✅ GraphQL 查询语法正确  
3. ❌ 子图没有索引到任何数据

## 🎯 立即检查步骤

### 1. 检查合约是否有数据
在浏览器访问：
```
https://sepolia.etherscan.io/address/0xcD6a42782d230D7c13A74ddec5dD140e55499Df9
```

检查：
- 合约部署在哪个区块？
- 是否有 `storeData` 交易？
- 是否有 `DataStored` 事件？

### 2. 常见问题和解决方案

#### 问题1: 起始区块太早
- **当前配置**: `startBlock: 13` 
- **解决**: 更新为合约实际部署区块号

#### 问题2: 没有触发过事件
- **现象**: 合约部署了但没有调用 `storeData`
- **解决**: 先在前端存储一些数据

#### 问题3: 事件签名不匹配
- **检查**: 实际合约的事件签名
- **对比**: 子图配置中的事件签名

## 🚀 快速修复

### 方案1: 更新起始区块 (推荐)
找到合约部署的实际区块号，然后更新：

```yaml
# 在 subgraph.yaml 中
source:
  address: '0xcD6a42782d230D7c13A74ddec5dD140e55499Df9'
  startBlock: ACTUAL_DEPLOYMENT_BLOCK  # 替换为实际区块号
```

### 方案2: 验证事件
检查合约是否真的触发过 `DataStored` 事件：

1. 在前端调用 `storeData` 存储一些数据
2. 在 Etherscan 查看交易日志
3. 确认事件被正确触发

### 方案3: 临时使用更早的区块
如果不确定部署区块，可以设置为更早的区块：

```yaml
startBlock: 6000000  # 更早的安全区块
```

## 🔧 立即行动计划

1. **检查合约信息** (3分钟)
   - 访问 Etherscan 查看合约状态
   - 记录部署区块号

2. **存储测试数据** (2分钟)  
   - 在前端调用 `storeData` 
   - 确认交易成功

3. **更新子图配置** (1分钟)
   - 更新正确的 startBlock
   - 重新部署子图

4. **等待同步** (5-10分钟)
   - 子图需要时间重新索引
   - 再次测试查询

## 💡 诊断命令

如果可以访问合约，用这个 GraphQL 查询来诊断：

```graphql
# 查看是否有任何实体
{
  dataStorageContracts {
    id
    totalEntries
    deploymentBlock
  }
  
  users {
    id
    totalEntries
  }
  
  _meta {
    block {
      number
      timestamp
    }
    deployment
  }
}
```

这个查询会显示：
- 合约统计信息
- 用户总数  
- 子图当前同步的区块
- 部署信息

## 🎯 如果仍然是空结果

1. **检查网络**: 确保子图部署在 Sepolia 网络
2. **检查地址**: 确认合约地址完全正确
3. **检查事件**: 确保合约真的触发过 DataStored 事件
4. **重新部署**: 清理后重新部署子图

---

**下一步**: 请先检查 Etherscan 上的合约信息，然后我们根据实际情况进行精确修复。