# 📈 The Graph 子图更新指南

## 🎯 问题分析
你的子图查询失败是因为子图配置的合约地址与新部署的DataStorage合约地址不匹配。

## 🔧 解决方案

### 方法1: 更新现有子图 (推荐)

#### 1. 获取新合约地址
从Remix部署成功后，复制新的DataStorage合约地址，例如：
```
0xYourNewContractAddress
```

#### 2. 更新子图配置
在你的子图项目中更新 `subgraph.yaml`：

```yaml
specVersion: 0.0.5
description: Blockchain Data System - DataStorage Contract Events
repository: https://github.com/limuran/blockchain-data-system
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: DataStorage
    network: sepolia  # 或者你部署的网络
    source:
      address: "0xYourNewContractAddress"  # 🔥 替换为你的新合约地址
      abi: DataStorage
      startBlock: 5000000  # 🔥 替换为你的合约部署区块号
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - DataStored
        - ContractDeployed
      abis:
        - name: DataStorage
          file: ./abis/DataStorage.json
      eventHandlers:
        - event: DataStored(indexed address,string,uint256,indexed string,indexed uint256,uint256,bytes32)
          handler: handleDataStored
        - event: ContractDeployed(indexed address,uint256,uint256)
          handler: handleContractDeployed
      file: ./src/data-storage.ts
```

#### 3. 更新合约ABI
将新的DataStorage合约ABI保存到 `abis/DataStorage.json`：

```json
[
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "deployer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "blockNumber", "type": "uint256"}
    ],
    "name": "ContractDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "data", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": true, "internalType": "string", "name": "dataType", "type": "string"},
      {"indexed": true, "internalType": "uint256", "name": "entryId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "blockNumber", "type": "uint256"},
      {"indexed": false, "internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
    ],
    "name": "DataStored",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "string", "name": "data", "type": "string"}, {"internalType": "string", "name": "dataType", "type": "string"}],
    "name": "storeData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDataCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]
```

#### 4. 更新映射处理器
`src/data-storage.ts`:
```typescript
import { DataStored, ContractDeployed } from "../generated/DataStorage/DataStorage"
import { DataStoredEntity, ContractInfo } from "../generated/schema"

export function handleDataStored(event: DataStored): void {
  let entity = new DataStoredEntity(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.user = event.params.user
  entity.data = event.params.data
  entity.timestamp = event.params.timestamp
  entity.dataType = event.params.dataType
  entity.entryId = event.params.entryId
  entity.blockNumber = event.params.blockNumber
  entity.dataHash = event.params.dataHash
  entity.transactionHash = event.transaction.hash
  entity.gasUsed = event.transaction.gasUsed
  
  entity.save()
}

export function handleContractDeployed(event: ContractDeployed): void {
  let entity = new ContractInfo("singleton")
  entity.deployer = event.params.deployer
  entity.deploymentTimestamp = event.params.timestamp
  entity.deploymentBlock = event.params.blockNumber
  entity.contractAddress = event.address
  entity.save()
}
```

#### 5. 重新部署子图
```bash
# 在子图项目目录
npm run codegen
npm run build
npm run deploy
```

### 方法2: 创建新子图

如果更新现有子图有问题，可以创建一个新的子图：

```bash
# 安装Graph CLI
npm install -g @graphprotocol/graph-cli

# 初始化新子图
graph init --studio your-subgraph-name

# 配置新的合约地址和网络
# 按照上面的配置步骤进行
```

### 方法3: 临时禁用子图查询

如果暂时不想处理子图，可以在前端临时禁用：

```javascript
// 在 DataQuery.js 中临时修改
const handleGraphQuery = async () => {
  showToast('🔧 子图功能暂时维护中，请先更新子图配置', 'info');
  return;
};
```

## 📝 更新清单

- [ ] 从Remix复制新的DataStorage合约地址
- [ ] 在子图项目中更新 subgraph.yaml 的合约地址
- [ ] 更新起始区块号为合约部署区块
- [ ] 更新合约ABI文件
- [ ] 重新生成和部署子图
- [ ] 在前端应用中测试子图查询

## 🎯 验证步骤

1. **合约验证**: 在etherscan查看合约是否部署成功
2. **子图验证**: 在Graph Studio查看子图是否同步
3. **前端验证**: 在应用中测试数据存储和查询

完成以上步骤后，你的子图查询就能正常工作了！