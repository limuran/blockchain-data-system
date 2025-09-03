// scripts/deploy-complete.js - 完整部署脚本 (Ethers v6)
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 开始完整部署流程...");
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1. 部署数据存储合约
  console.log("\n📦 部署数据存储合约...");
  const DataStorage = await ethers.getContractFactory("DataStorage");
  const dataStorage = await DataStorage.deploy();
  await dataStorage.waitForDeployment();
  
  const contractAddress = await dataStorage.getAddress();
  const deployTransaction = dataStorage.deploymentTransaction();
  
  console.log("✅ DataStorage 合约部署成功!");
  console.log("📍 合约地址:", contractAddress);
  console.log("🔗 部署交易:", deployTransaction.hash);
  console.log("🏗️ 部署区块:", deployTransaction.blockNumber);

  // 2. 等待确认
  console.log("\n⏳ 等待区块确认...");
  await deployTransaction.wait(3);

  // 3. 写入测试数据
  console.log("\n📝 写入测试数据...");
  
  const testData = [
    { data: "Hello Blockchain World!", type: "text" },
    { data: '{"name": "Alice", "age": 30, "city": "Shanghai"}', type: "json" },
    { data: "0x1234567890abcdef1234567890abcdef12345678", type: "hash" },
    { data: "用户注册信息：张三，手机号码：138****1234", type: "text" },
    { data: '{"product": "iPhone 15", "price": 999, "currency": "USD"}', type: "json" }
  ];

  for (let i = 0; i < testData.length; i++) {
    const tx = await dataStorage.storeData(testData[i].data, testData[i].type);
    console.log(`📄 数据 ${i + 1} 已写入，交易哈希: ${tx.hash}`);
    await tx.wait();
  }

  // 4. 验证数据
  console.log("\n🔍 验证数据...");
  const totalCount = await dataStorage.getDataCount();
  console.log("📊 总数据条数:", totalCount.toString());

  const stats = await dataStorage.getStats();
  console.log("📈 统计信息:");
  console.log("  - 总条目:", stats.totalEntries.toString());
  console.log("  - 总用户:", stats.totalUsers.toString());
  console.log("  - 最新区块:", stats.latestBlockNumber.toString());

  // 5. 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deploymentBlock: deployTransaction.blockNumber,
    deploymentHash: deployTransaction.hash,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    gasUsed: deployTransaction.gasLimit?.toString(),
    testDataCount: testData.length
  };

  // 保存到文件
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 部署信息已保存到:", deploymentFile);

  // 6. 生成前端配置
  const frontendConfig = {
    CONTRACT_ADDRESS: contractAddress,
    NETWORK_NAME: hre.network.name,
    DEPLOYMENT_BLOCK: deployTransaction.blockNumber,
    THE_GRAPH_ENDPOINT: `https://api.studio.thegraph.com/query/your-subgraph-id/usdt-data-tracker/version/latest`,
    ETHERSCAN_BASE_URL: getEtherscanUrl(hre.network.name)
  };

  const configFile = path.join(__dirname, '../frontend-config.json');
  fs.writeFileSync(configFile, JSON.stringify(frontendConfig, null, 2));
  console.log("🌐 前端配置已保存到:", configFile);

  // 7. 生成子图配置
  const subgraphConfig = generateSubgraphConfig(contractAddress, deployTransaction.blockNumber);
  const subgraphFile = path.join(__dirname, '../subgraph-generated.yaml');
  fs.writeFileSync(subgraphFile, subgraphConfig);
  console.log("📊 子图配置已生成:", subgraphFile);

  console.log("\n🎉 部署完成!");
  console.log("📋 摘要:");
  console.log("  - 合约地址:", contractAddress);
  console.log("  - 网络:", hre.network.name);
  console.log("  - 测试数据:", testData.length, "条");
  console.log("  - Gas 消耗: 估算", ethers.formatUnits(deploymentInfo.gasUsed || "0", "gwei"), "Gwei");

  return deploymentInfo;
}

function getEtherscanUrl(networkName) {
  const urls = {
    mainnet: "https://etherscan.io",
    sepolia: "https://sepolia.etherscan.io",
    goerli: "https://goerli.etherscan.io",
    polygon: "https://polygonscan.com",
    mumbai: "https://mumbai.polygonscan.com"
  };
  return urls[networkName] || "https://etherscan.io";
}

function generateSubgraphConfig(contractAddress, startBlock) {
  return `specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: DataStorage
    network: ${hre.network.name}
    source:
      address: "${contractAddress}"
      abi: DataStorage
      startBlock: ${startBlock}
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - DataEntry
        - User
        - DataType
        - Stats
      abis:
        - name: DataStorage
          file: ./abis/DataStorage.json
      eventHandlers:
        - event: DataStored(indexed address,string,uint256,string,indexed uint256,uint256)
          handler: handleDataStored
        - event: UserFirstData(indexed address,uint256)
          handler: handleUserFirstData
      file: ./src/data-storage.ts`;
}

// 运行部署
if (require.main === module) {
  main()
    .then((result) => {
      console.log("✅ 部署脚本执行成功");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 部署失败:", error);
      process.exit(1);
    });
}

module.exports = { main };