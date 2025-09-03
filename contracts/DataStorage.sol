// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DataStorage {
    struct DataEntry {
        address user;
        string data;  // 改为支持任意字符串，而非JSON
        uint256 timestamp;
        string dataType;
        uint256 blockNumber;
        bytes32 dataHash;  // 新增数据哈希用于快速查找
    }
    
    // 存储所有数据条目
    DataEntry[] public dataEntries;
    
    // 用户数据计数
    mapping(address => uint256) public userDataCount;
    
    // 数据类型计数
    mapping(string => uint256) public dataTypeCount;
    
    // 数据哈希到ID的映射
    mapping(bytes32 => uint256) public dataHashToId;
    
    // 管理员地址
    address public owner;
    
    // 构造函数 - 解决Instructor缺失问题
    constructor() {
        owner = msg.sender;
        emit ContractDeployed(msg.sender, block.timestamp, block.number);
    }
    
    // 事件定义 - 用于 The Graph 索引和日志查询
    event DataStored(
        address indexed user,
        string data,  // 任意字符串数据
        uint256 timestamp,
        string indexed dataType,
        uint256 indexed entryId,
        uint256 blockNumber,
        bytes32 dataHash
    );
    
    event UserFirstData(
        address indexed user,
        uint256 timestamp
    );
    
    event ContractDeployed(
        address indexed deployer,
        uint256 timestamp,
        uint256 blockNumber
    );
    
    event DataQueried(
        address indexed querier,
        string queryType,
        uint256 resultCount,
        uint256 timestamp
    );
    
    // 存储数据函数 - 支持任意字符串
    function storeData(string memory _data, string memory _dataType) public {
        require(bytes(_data).length > 0, "Data cannot be empty");
        require(bytes(_dataType).length > 0, "Data type cannot be empty");
        
        bool isFirstData = userDataCount[msg.sender] == 0;
        bytes32 dataHash = keccak256(abi.encodePacked(_data, msg.sender, block.timestamp));
        
        DataEntry memory newEntry = DataEntry({
            user: msg.sender,
            data: _data,  // 直接存储任意字符串
            timestamp: block.timestamp,
            dataType: _dataType,
            blockNumber: block.number,
            dataHash: dataHash
        });
        
        dataEntries.push(newEntry);
        uint256 entryId = dataEntries.length - 1;
        
        userDataCount[msg.sender]++;
        dataTypeCount[_dataType]++;
        dataHashToId[dataHash] = entryId;
        
        emit DataStored(
            msg.sender,
            _data,
            block.timestamp,
            _dataType,
            entryId,
            block.number,
            dataHash
        );
        
        if (isFirstData) {
            emit UserFirstData(msg.sender, block.timestamp);
        }
    }
    
    // 获取数据总数
    function getDataCount() public view returns (uint256) {
        return dataEntries.length;
    }
    
    // 获取用户的数据
    function getUserData(address _user) public view returns (DataEntry[] memory) {
        uint256 userCount = userDataCount[_user];
        DataEntry[] memory userEntries = new DataEntry[](userCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < dataEntries.length; i++) {
            if (dataEntries[i].user == _user) {
                userEntries[currentIndex] = dataEntries[i];
                currentIndex++;
            }
        }
        
        return userEntries;
    }
    
    // 获取最新的N条数据
    function getLatestData(uint256 _count) public view returns (DataEntry[] memory) {
        uint256 totalEntries = dataEntries.length;
        uint256 returnCount = _count > totalEntries ? totalEntries : _count;
        
        DataEntry[] memory latestEntries = new DataEntry[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            latestEntries[i] = dataEntries[totalEntries - 1 - i];
        }
        
        return latestEntries;
    }
    
    // 按数据类型获取数据
    function getDataByType(string memory _dataType) public view returns (DataEntry[] memory) {
        uint256 typeCount = dataTypeCount[_dataType];
        DataEntry[] memory typeEntries = new DataEntry[](typeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < dataEntries.length; i++) {
            if (keccak256(bytes(dataEntries[i].dataType)) == keccak256(bytes(_dataType))) {
                typeEntries[currentIndex] = dataEntries[i];
                currentIndex++;
            }
        }
        
        return typeEntries;
    }
    
    // 通过哈希查找数据
    function getDataByHash(bytes32 _dataHash) public view returns (DataEntry memory) {
        uint256 entryId = dataHashToId[_dataHash];
        require(entryId < dataEntries.length, "Data not found");
        
        return dataEntries[entryId];
    }
    
    // 获取统计信息
    function getStats() public view returns (
        uint256 totalEntries,
        uint256 totalUsers,
        uint256 latestBlockNumber
    ) {
        totalEntries = dataEntries.length;
        
        address[] memory uniqueUsers = new address[](totalEntries);
        uint256 userCount = 0;
        
        for (uint256 i = 0; i < totalEntries; i++) {
            address currentUser = dataEntries[i].user;
            bool isNewUser = true;
            
            for (uint256 j = 0; j < userCount; j++) {
                if (uniqueUsers[j] == currentUser) {
                    isNewUser = false;
                    break;
                }
            }
            
            if (isNewUser) {
                uniqueUsers[userCount] = currentUser;
                userCount++;
            }
        }
        
        totalUsers = userCount;
        latestBlockNumber = totalEntries > 0 ? dataEntries[totalEntries - 1].blockNumber : 0;
    }
}