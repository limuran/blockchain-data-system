const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DataStorage Contract", function () {
  let DataStorage;
  let dataStorage;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约
    DataStorage = await ethers.getContractFactory("DataStorage");
    dataStorage = await DataStorage.deploy();
    await dataStorage.waitForDeployment();
  });

  describe("部署测试", function () {
    it("应该正确部署合约", async function () {
      expect(await dataStorage.getAddress()).to.be.properAddress;
    });

    it("初始数据计数应该为0", async function () {
      const count = await dataStorage.getDataCount();
      expect(count).to.equal(0);
    });
  });

  describe("数据存储功能", function () {
    it("应该能够存储单条数据", async function () {
      const testData = "Hello World";
      const dataType = "text";
      
      await expect(dataStorage.storeData(testData, dataType))
        .to.emit(dataStorage, "DataStored");

      const count = await dataStorage.getDataCount();
      expect(count).to.equal(1);
    });

    it("应该能够存储多条数据", async function () {
      const testData = ["Data 1", "Data 2", "Data 3"];
      const dataTypes = ["text", "text", "text"];

      await dataStorage.storeMultipleData(testData, dataTypes);

      const count = await dataStorage.getDataCount();
      expect(count).to.equal(3);
    });

    it("应该正确记录用户数据计数", async function () {
      await dataStorage.connect(addr1).storeData("User1 Data", "text");
      await dataStorage.connect(addr2).storeData("User2 Data", "text");
      await dataStorage.connect(addr1).storeData("User1 Data 2", "text");

      const user1Count = await dataStorage.userDataCount(addr1.address);
      const user2Count = await dataStorage.userDataCount(addr2.address);

      expect(user1Count).to.equal(2);
      expect(user2Count).to.equal(1);
    });

    it("应该正确记录数据类型计数", async function () {
      await dataStorage.storeData("Text data", "text");
      await dataStorage.storeData('{"key": "value"}', "json");
      await dataStorage.storeData("Another text", "text");

      const textCount = await dataStorage.dataTypeCount("text");
      const jsonCount = await dataStorage.dataTypeCount("json");

      expect(textCount).to.equal(2);
      expect(jsonCount).to.equal(1);
    });
  });

  describe("数据查询功能", function () {
    beforeEach(async function () {
      // 准备测试数据
      await dataStorage.connect(addr1).storeData("User1 Data1", "text");
      await dataStorage.connect(addr1).storeData('{"user1": "data2"}', "json");
      await dataStorage.connect(addr2).storeData("User2 Data1", "text");
    });

    it("应该能够获取用户的数据", async function () {
      const user1Data = await dataStorage.getUserData(addr1.address);
      expect(user1Data.length).to.equal(2);
      expect(user1Data[0].data).to.equal("User1 Data1");
      expect(user1Data[1].data).to.equal('{"user1": "data2"}');
    });

    it("应该能够获取最新数据", async function () {
      const latestData = await dataStorage.getLatestData(2);
      expect(latestData.length).to.equal(2);
      expect(latestData[0].data).to.equal("User2 Data1"); // 最新的
      expect(latestData[1].data).to.equal('{"user1": "data2"}'); // 倒数第二新的
    });

    it("应该能够按类型获取数据", async function () {
      const textData = await dataStorage.getDataByType("text");
      const jsonData = await dataStorage.getDataByType("json");

      expect(textData.length).to.equal(2);
      expect(jsonData.length).to.equal(1);
    });

    it("应该返回正确的统计信息", async function () {
      const stats = await dataStorage.getStats();
      expect(stats.totalEntries).to.equal(3);
      expect(stats.totalUsers).to.equal(2);
    });
  });

  describe("事件测试", function () {
    it("存储数据时应该触发DataStored事件", async function () {
      const testData = "Test Data";
      const dataType = "text";

      await expect(dataStorage.storeData(testData, dataType))
        .to.emit(dataStorage, "DataStored");
    });

    it("首次存储应该触发UserFirstData事件", async function () {
      await expect(dataStorage.connect(addr1).storeData("First data", "text"))
        .to.emit(dataStorage, "UserFirstData")
        .withArgs(addr1.address, expect.any(Object));

      // 第二次不应该触发
      await expect(dataStorage.connect(addr1).storeData("Second data", "text"))
        .to.not.emit(dataStorage, "UserFirstData");
    });
  });

  describe("边界条件测试", function () {
    it("应该处理空字符串数据", async function () {
      await expect(dataStorage.storeData("", "empty"))
        .to.not.be.reverted;

      const count = await dataStorage.getDataCount();
      expect(count).to.equal(1);
    });

    it("应该处理长文本数据", async function () {
      const longText = "a".repeat(1000);
      await expect(dataStorage.storeData(longText, "long"))
        .to.not.be.reverted;
    });

    it("批量存储时数组长度不匹配应该失败", async function () {
      const data = ["data1", "data2"];
      const types = ["type1"];

      await expect(dataStorage.storeMultipleData(data, types))
        .to.be.revertedWith("Arrays length mismatch");
    });

    it("查询不存在用户的数据应该返回空数组", async function () {
      const emptyData = await dataStorage.getUserData(addr1.address);
      expect(emptyData.length).to.equal(0);
    });
  });

  describe("Gas 优化测试", function () {
    it("批量存储应该比单个存储更节省 Gas", async function () {
      const data = ["data1", "data2", "data3"];
      const types = ["text", "text", "text"];

      // 单个存储的 Gas 消耗
      const singleTx1 = await dataStorage.storeData(data[0], types[0]);
      const singleReceipt1 = await singleTx1.wait();
      
      const singleTx2 = await dataStorage.storeData(data[1], types[1]);
      const singleReceipt2 = await singleTx2.wait();
      
      const singleTx3 = await dataStorage.storeData(data[2], types[2]);
      const singleReceipt3 = await singleTx3.wait();

      const totalSingleGas = singleReceipt1.gasUsed + singleReceipt2.gasUsed + singleReceipt3.gasUsed;

      // 重新部署合约进行批量测试
      const newDataStorage = await DataStorage.deploy();
      await newDataStorage.waitForDeployment();

      // 批量存储的 Gas 消耗
      const batchTx = await newDataStorage.storeMultipleData(data, types);
      const batchReceipt = await batchTx.wait();

      console.log(`单个存储总 Gas: ${totalSingleGas}`);
      console.log(`批量存储 Gas: ${batchReceipt.gasUsed}`);

      // 批量存储应该更高效
      expect(batchReceipt.gasUsed).to.be.lessThan(totalSingleGas);
    });
  });
});