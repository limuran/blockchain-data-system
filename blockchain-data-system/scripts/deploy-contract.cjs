const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 开始部署 DataStorage 合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  警告: ETH余额低于0.01，可能不足支付Gas费用");
    console.log("💧 获取测试ETH: https://sepoliafaucet.com");
  }

  // 部署合约
  console.log("🏧 正在部署 DataStorage 合约...");
  const DataStorage = await ethers.getContractFactory("DataStorage");
  const dataStorage = await DataStorage.deploy();

  console.log("⏳ 等待部署确认...");
  await dataStorage.waitForDeployment();
  
  const contractAddress = await dataStorage.getAddress();
  const deploymentTx = dataStorage.deploymentTransaction();

  console.log("🎉 DataStorage 合约部署成功!");
  console.log("📍 合约地址:", contractAddress);
  console.log("📋 部署交易:", deploymentTx.hash);
  console.log("🎡 部署区块:", deploymentTx.blockNumber);
  console.log("🔗 区块浏览器:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // 验证合约功能
  console.log("\n🔍 验证合约功能...");
  try {
    const initialCount = await dataStorage.getDataCount();
    console.log("📊 初始数据计数:", Number(initialCount));
    
    // 存储测试数据
    console.log("📝 存储测试数据...");
    const testTx = await dataStorage.storeData(
      "测试数据: 这是一条中文测试 Test: Hello World from Hardhat!", 
      "test_data"
    );
    console.log("⏳ 等待交易确认...");
    const testReceipt = await testTx.wait();
    
    const newCount = await dataStorage.getDataCount();
    console.log("✅ 测试数据存储成功，新计数:", Number(newCount));
    console.log("🎡 测试交易哈希:", testTx.hash);
  } catch (error) {
    console.error("❌ 合约验证失败:", error.message);
  }

  // 输出部署信息到文件
  const deployInfo = {
    contractAddress,
    deployerAddress: deployer.address,
    deploymentTxHash: deploymentTx.hash,
    deploymentBlock: deploymentTx.blockNumber,
    network: "Sepolia",
    deploymentTime: new Date().toISOString(),
    explorerUrl: `https://sepolia.etherscan.io/address/${contractAddress}`,
    startBlockForSubgraph: deploymentTx.blockNumber
  };

  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deployInfo, null, 2)
  );
  
  console.log("\n📋 部署信息已保存到 deployment-info.json");
  console.log("\n🎯 下一步操作:");
  console.log(`1. 📝 将合约地址复制到前端: ${contractAddress}`);
  console.log(`2. 📈 更新子图 startBlock: ${deploymentTx.blockNumber}`);
  console.log(`3. 🎡 在区块浏览器中查看: https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log(`4. 🚀 测试前端合约调用功能`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("🚨 部署失败:", error);
    process.exit(1);
  });