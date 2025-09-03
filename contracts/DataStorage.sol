// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DataStorage
 * @dev 用于永久存储任意字符串数据的智能合约
 * @author Blockchain Data System
 */
contract DataStorage {
    struct DataEntry {
        address user;
        string data;
        uint256 timestamp;
        string dataType;
        uint256 blockNumber;
        bytes32 dataHash;
    }

    // 存储所有数据条目
    DataEntry[] public dataEntries;
    
    // 用户数据索引 user => entryId[]
    mapping(address => uint256[]) public userDataIndex;
    
    // 数据类型索引 dataType => entryId[]
    mapping(string => uint256[]) public dataTypeIndex;
    
    // 数据哈希索引 dataHash => entryId  
    mapping(bytes32 => uint256) public dataHashIndex;
    
    // 合约所有者
    address public owner;
    
    // 统计信息
    uint256 public totalUsers;
    uint256 public totalDataTypes;
    
    // 事件定义
    event ContractDeployed(address indexed deployer, uint256 timestamp, uint256 blockNumber);
    event DataStored(
        address indexed user, 
        string data, 
        uint256 timestamp, 
        string indexed dataType, 
        uint256 indexed entryId,
        uint256 blockNumber,
        bytes32 dataHash
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit ContractDeployed(msg.sender, block.timestamp, block.number);
    }

    /**
     * @dev 存储数据到合约
     * @param data 要存储的数据字符串
     * @param dataType 数据类型标识
     */
    function storeData(string memory data, string memory dataType) external {
        require(bytes(data).length > 0, "Data cannot be empty");
        require(bytes(dataType).length > 0, "Data type cannot be empty");
        
        // 计算数据哈希
        bytes32 dataHash = keccak256(abi.encodePacked(data, msg.sender, block.timestamp));
        
        // 创建数据条目
        DataEntry memory newEntry = DataEntry({
            user: msg.sender,
            data: data,
            timestamp: block.timestamp,
            dataType: dataType,
            blockNumber: block.number,
            dataHash: dataHash
        });
        
        // 存储数据
        dataEntries.push(newEntry);
        uint256 entryId = dataEntries.length - 1;
        
        // 更新索引
        userDataIndex[msg.sender].push(entryId);
        dataTypeIndex[dataType].push(entryId);
        dataHashIndex[dataHash] = entryId;
        
        // 更新统计信息
        if (userDataIndex[msg.sender].length == 1) {
            totalUsers++;
        }
        if (dataTypeIndex[dataType].length == 1) {
            totalDataTypes++;
        }
        
        emit DataStored(
            msg.sender,
            data,
            block.timestamp,
            dataType,
            entryId,
            block.number,
            dataHash
        );
    }

    /**
     * @dev 获取数据总数
     */
    function getDataCount() external view returns (uint256) {
        return dataEntries.length;
    }
    
    /**
     * @dev 获取指定用户的所有数据
     * @param user 用户地址
     */
    function getUserData(address user) external view returns (DataEntry[] memory) {
        uint256[] memory entryIds = userDataIndex[user];
        DataEntry[] memory result = new DataEntry[](entryIds.length);
        
        for (uint256 i = 0; i < entryIds.length; i++) {
            result[i] = dataEntries[entryIds[i]];
        }
        
        return result;
    }
    
    /**
     * @dev 按数据类型获取数据
     * @param dataType 数据类型
     */
    function getDataByType(string memory dataType) external view returns (DataEntry[] memory) {
        uint256[] memory entryIds = dataTypeIndex[dataType];
        DataEntry[] memory result = new DataEntry[](entryIds.length);
        
        for (uint256 i = 0; i < entryIds.length; i++) {
            result[i] = dataEntries[entryIds[i]];
        }
        
        return result;
    }
    
    /**
     * @dev 获取最新的N条数据
     * @param count 数据条数
     */
    function getLatestData(uint256 count) external view returns (DataEntry[] memory) {
        uint256 totalCount = dataEntries.length;
        if (totalCount == 0) {
            return new DataEntry[](0);
        }
        
        uint256 actualCount = count > totalCount ? totalCount : count;
        DataEntry[] memory result = new DataEntry[](actualCount);
        
        for (uint256 i = 0; i < actualCount; i++) {
            result[i] = dataEntries[totalCount - 1 - i];
        }
        
        return result;
    }
    
    /**
     * @dev 获取合约统计信息
     */
    function getStats() external view returns (
        uint256 totalEntries,
        uint256 _totalUsers,
        uint256 _totalDataTypes,
        uint256 latestBlockNumber
    ) {
        totalEntries = dataEntries.length;
        _totalUsers = totalUsers;
        _totalDataTypes = totalDataTypes;
        latestBlockNumber = dataEntries.length > 0 ? dataEntries[dataEntries.length - 1].blockNumber : 0;
    }
    
    /**
     * @dev 按索引获取数据条目
     * @param index 数据索引
     */
    function getDataByIndex(uint256 index) external view returns (DataEntry memory) {
        require(index < dataEntries.length, "Index out of bounds");
        return dataEntries[index];
    }
    
    /**
     * @dev 检查数据哈希是否存在
     * @param dataHash 数据哈希
     */
    function dataHashExists(bytes32 dataHash) external view returns (bool) {
        return dataHashIndex[dataHash] > 0 || 
               (dataEntries.length > 0 && dataEntries[0].dataHash == dataHash);
    }
    
    /**
     * @dev 转移合约所有权
     * @param newOwner 新所有者地址
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @dev 获取用户数据条数
     * @param user 用户地址
     */
    function getUserDataCount(address user) external view returns (uint256) {
        return userDataIndex[user].length;
    }
    
    /**
     * @dev 获取数据类型的数据条数
     * @param dataType 数据类型
     */
    function getDataTypeCount(string memory dataType) external view returns (uint256) {
        return dataTypeIndex[dataType].length;
    }
}