// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DataStorage {
    struct DataEntry {
        address user;
        string data;
        uint256 timestamp;
        string dataType;
        uint256 blockNumber;
    }
    
    // 存储所有数据条目
    DataEntry[] public dataEntries;
    
    // 用户数据计数
    mapping(address => uint256) public userDataCount;
    
    // 数据类型计数
    mapping(string => uint256) public dataTypeCount;
    
    // 事件定义 - 用于 The Graph 索引
    event DataStored(
        address indexed user,
        string data,
        uint256 timestamp,
        string dataType,
        uint256 indexed entryId,
        uint256 blockNumber
    );
    
    event UserFirstData(
        address indexed user,
        uint256 timestamp
    );
    
    // 存储数据函数
    function storeData(string memory _data, string memory _dataType) public {
        bool isFirstData = userDataCount[msg.sender] == 0;
        
        DataEntry memory newEntry = DataEntry({
            user: msg.sender,
            data: _data,
            timestamp: block.timestamp,
            dataType: _dataType,
            blockNumber: block.number
        });
        
        dataEntries.push(newEntry);
        userDataCount[msg.sender]++;
        dataTypeCount[_dataType]++;
        
        uint256 entryId = dataEntries.length - 1;
        
        emit DataStored(
            msg.sender,
            _data,
            block.timestamp,
            _dataType,
            entryId,
            block.number
        );
        
        if (isFirstData) {
            emit UserFirstData(msg.sender, block.timestamp);
        }
    }
    
    // 批量存储数据
    function storeMultipleData(
        string[] memory _dataArray, 
        string[] memory _dataTypes
    ) public {
        require(_dataArray.length == _dataTypes.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _dataArray.length; i++) {
            storeData(_dataArray[i], _dataTypes[i]);
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
    
    // 获取统计信息
    function getStats() public view returns (
        uint256 totalEntries,
        uint256 totalUsers,
        uint256 latestBlockNumber
    ) {
        totalEntries = dataEntries.length;
        
        // 计算唯一用户数
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