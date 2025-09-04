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

  describe("部署测试", function () {
    it("应该设置正确的所有者", async function () {
      expect(await dataStorage.owner()).to.equal(owner.address);
    });

    it("初始数据计数应该为0", async function () {
      expect(await dataStorage.getDataCount()).to.equal(0);
    });
  });

  describe("数据存储测试", function () {
    it("应该成功存储中文数据", async function () {
      const testData = "测试数据: 这是一条中文测试";
      const dataType = "test_data";

      await expect(dataStorage.connect(user1).storeData(testData, dataType))
        .to.emit(dataStorage, "DataStored");

      expect(await dataStorage.getDataCount()).to.equal(1);
    });

    it("应该成功存储英文数据", async function () {
      const testData = "Test data: Hello World from Hardhat!";
      const dataType = "user_data";

      await dataStorage.connect(user1).storeData(testData, dataType);
      expect(await dataStorage.getDataCount()).to.equal(1);
      
      const userData = await dataStorage.getUserData(user1.address);
      expect(userData.length).to.equal(1);
      expect(userData[0].data).to.equal(testData);
    });

    it("不应该允许空数据", async function () {
      await expect(dataStorage.storeData("", "test"))
        .to.be.revertedWith("Data cannot be empty");
    });
  });

  describe("查询功能测试", function () {
    beforeEach(async function () {
      await dataStorage.connect(user1).storeData("用户1数据", "user_data");
      await dataStorage.connect(user2).storeData("用户2数据", "user_data");
      await dataStorage.connect(user1).storeData("交易记录", "transaction_log");
    });

    it("应该正确获取用户数据", async function () {
      const userData = await dataStorage.getUserData(user1.address);
      expect(userData.length).to.equal(2);
      expect(userData[0].data).to.equal("用户1数据");
    });

    it("应该正确获取统计信息", async function () {
      const stats = await dataStorage.getStats();
      expect(stats.totalEntries).to.equal(3);
      expect(stats._totalUsers).to.equal(2);
    });
  });
});