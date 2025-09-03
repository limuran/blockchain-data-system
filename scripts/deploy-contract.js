const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 开始部署 DataStorage 合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📍 部署者地址:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 部署合约
  const DataStorage = await ethers.getContractFactory("DataStorage");
  const dataStorage = await DataStorage.deploy();

  await dataStorage.waitForDeployment();
  const contractAddress = await dataStorage.getAddress();

  console.log("✅ DataStorage 合约部署成功!");
  console.log("📍 合约地址:", contractAddress);
  console.log("🔗 区块浏览器:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // 验证合约
  console.log("🔍 验证合约功能...");
  try {
    const initialCount = await dataStorage.getDataCount();
    console.log("📊 初始数据计数:", Number(initialCount));
    
    // 存储测试数据
    console.log("📝 存储测试数据...");
    const testTx = await dataStorage.storeData(
      "测试数据: 这是一条中文测试数据 Test data: This is a test string", 
      "test_data"
    );
    await testTx.wait();
    
    const newCount = await dataStorage.getDataCount();
    console.log("✅ 测试数据存储成功，新计数:", Number(newCount));
  } catch (error) {
    console.error("❌ 合约验证失败:", error);
  }

  // 输出部署信息到文件
  const deployInfo = {
    contractAddress,
    deployerAddress: deployer.address,
    network: "Sepolia",
    deploymentTime: new Date().toISOString(),
    explorerUrl: `https://sepolia.etherscan.io/address/${contractAddress}`
  };

  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deployInfo, null, 2)
  );
  
  console.log("\n📋 部署信息已保存到 deployment-info.json");
  console.log("\n🎯 下一步:");
  console.log("1. 将合约地址复制到前端应用的合约地址输入框");
  console.log("2. 或者将地址添加到 .env 文件中");
  console.log("3. 确保已在 Sepolia 测试网络上操作");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });