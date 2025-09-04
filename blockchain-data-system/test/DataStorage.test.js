const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DataStorage", function () {
  let DataStorage;
  let dataStorage;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    DataStorage = await ethers.getContractFactory("DataStorage");
    dataStorage = await DataStorage.deploy();
    await dataStorage.waitForDeployment();
  });

  describe("部署", function () {
    it("应该设置正确的所有者", async function () {
      expect(await dataStorage.owner()).to.equal(owner.address);
    });

    it("应该触发ContractDeployed事件", async function () {
      const filter = dataStorage.filters.ContractDeployed();
      const events = await dataStorage.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(owner.address);
    });

    it("初始数据计数应该为0", async function () {
      expect(await dataStorage.getDataCount()).to.equal(0);
    });
  });

  describe("数据存储", function () {
    it("应该成功存储数据", async function () {
      const testData = "测试数据: 这是一条中文测试";
      const dataType = "test_data";

      await expect(dataStorage.connect(user1).storeData(testData, dataType))
        .to.emit(dataStorage, "DataStored")
        .withArgs(
          user1.address,
          testData,
          anyValue, // timestamp
          dataType,
          0, // entryId
          anyValue, // blockNumber
          anyValue  // dataHash
        );

      expect(await dataStorage.getDataCount()).to.equal(1);
    });

    it("不应该允许空数据", async function () {
      await expect(dataStorage.storeData("", "test"))
        .to.be.revertedWith("Data cannot be empty");
    });

    it("不应该允许空数据类型", async function () {
      await expect(dataStorage.storeData("test data", ""))
        .to.be.revertedWith("Data type cannot be empty");
    });
  });

  describe("数据查询", function () {
    beforeEach(async function () {
      await dataStorage.connect(user1).storeData("用户1数据", "user_data");
      await dataStorage.connect(user2).storeData("用户2数据", "user_data");
      await dataStorage.connect(user1).storeData("交易记录", "transaction_log");
    });

    it("应该正确获取用户数据", async function () {
      const userData = await dataStorage.getUserData(user1.address);
      expect(userData.length).to.equal(2);
      expect(userData[0].data).to.equal("用户1数据");
      expect(userData[1].data).to.equal("交易记录");
    });

    it("应该正确按类型获取数据", async function () {
      const userTypeData = await dataStorage.getDataByType("user_data");
      expect(userTypeData.length).to.equal(2);
    });

    it("应该正确获取最新数据", async function () {
      const latestData = await dataStorage.getLatestData(2);
      expect(latestData.length).to.equal(2);
      expect(latestData[0].data).to.equal("交易记录"); // 最新的
    });

    it("应该正确获取统计信息", async function () {
      const stats = await dataStorage.getStats();
      expect(stats.totalEntries).to.equal(3);
      expect(stats._totalUsers).to.equal(2);
      expect(stats._totalDataTypes).to.equal(2);
    });
  });

  describe("权限管理", function () {
    it("应该允许所有者转移所有权", async function () {
      await expect(dataStorage.transferOwnership(user1.address))
        .to.emit(dataStorage, "OwnershipTransferred")
        .withArgs(owner.address, user1.address);

      expect(await dataStorage.owner()).to.equal(user1.address);
    });

    it("不应该允许非所有者转移所有权", async function () {
      await expect(dataStorage.connect(user1).transferOwnership(user2.address))
        .to.be.revertedWith("Only owner can call this function");
    });
  });

  const anyValue = require("@nomicfoundation/hardhat-chai-matchers/withArgs").anyValue;
});