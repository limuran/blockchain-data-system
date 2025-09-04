# 1️⃣ 检查Truffle版本

truffle version

# 2️⃣ 编译合约

truffle compile

# 3️⃣ 测试合约（可选，在本地）

truffle test

# 4️⃣ 检查网络配置

truffle networks

# 5️⃣ 部署到Sepolia测试网

truffle migrate --network sepolia

# 6️⃣ 如果需要重新部署（慎用）

truffle migrate --network sepolia --reset

# 7️⃣ 验证合约（可选）

truffle run verify DataStorage --network sepolia

# 🔍 其他有用命令

# 查看部署状态

truffle networks --clean

# 进入Truffle控制台

truffle console --network sepolia

# 检查账户余额

truffle exec scripts/check-balance.js --network sepolia


Deploying 'DataStorage'
   -----------------------
   >
   > transaction hash:    0xcfbfb86449aa3d4b47b77d7388559769e5638dbcf49dcae083c20cb277fea50b
   > Blocks: 2            Seconds: 17
   > contract address:    0xcfb9534B39a81271464dF275b2ADBD697cB3b293
   > block number:        9132773
   > block timestamp:     1757001900
   > account:             0x0F07CdFa12e37cB52f88CDdBE06Db475cf89f423
   > balance:             0.661124915622670357
   > gas used:            1105406 (0x10ddfe)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.02210812 ETH

   Pausing for 2 confirmations...

   -------------------------------
   > confirmation number: 1 (block: 9132774)
   > confirmation number: 2 (block: 9132775)

Deploying 'InfoContract'
   ------------------------
   >
   > transaction hash:    0x0b361556bd735a3b51cb7440e55fd501e571cda323512bb6c9a6ea8eea23fb4a
   > Blocks: 1            Seconds: 5
   > contract address:    0xAD8620a1D9de62424F3F2ec3A46C44EA17FA73D6
   > block number:        9132776
   > block timestamp:     1757001936
   > account:             0x0F07CdFa12e37cB52f88CDdBE06Db475cf89f423
   > balance:             0.654166435622670357
   > gas used:            347924 (0x54f14)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00695848 ETH
