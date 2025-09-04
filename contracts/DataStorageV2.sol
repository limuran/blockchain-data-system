// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DataStorageV2 {
    struct DataEntry {
        address user;
        string data;
        uint256 timestamp;
        string dataType;
        uint256 entryId;
        uint256 blockNumber;
        bytes32 dataHash;
    }
    
    DataEntry[] public dataEntries;
    address public owner;
    
    // 🔥 事件定义 - 确保完全匹配子图配置
    event DataStored(
        address indexed user,
        string data,
        uint256 timestamp,
        string dataType,  // 非 indexed
        uint256 indexed entryId,
        uint256 blockNumber,
        bytes32 dataHash
    );
    
    event ContractDeployed(
        address indexed deployer,
        uint256 timestamp,
        uint256 blockNumber
    );
    
    constructor() {
        owner = msg.sender;
        // 立即发出部署事件
        emit ContractDeployed(msg.sender, block.timestamp, block.number);
    }
    
    function storeData(string memory _data, string memory _dataType) public {
        // 输入验证
        require(bytes(_data).length > 0, "Data cannot be empty");
        require(bytes(_dataType).length > 0, "Data type cannot be empty");
        
        // 准备数据
        uint256 entryId = dataEntries.length;
        bytes32 dataHash = keccak256(abi.encodePacked(_data, _dataType, msg.sender, block.timestamp));
        
        // 存储数据
        dataEntries.push(DataEntry({
            user: msg.sender,
            data: _data,
            timestamp: block.timestamp,
            dataType: _dataType,
            entryId: entryId,
            blockNumber: block.number,
            dataHash: dataHash
        }));
        
        // 🔥 关键：立即发出事件
        emit DataStored(
            msg.sender,      // indexed address user
            _data,           // string data
            block.timestamp, // uint256 timestamp  
            _dataType,       // string dataType (非indexed)
            entryId,         // indexed uint256 entryId
            block.number,    // uint256 blockNumber
            dataHash         // bytes32 dataHash
        );
    }
    
    // 查询函数
    function getDataCount() public view returns (uint256) {
        return dataEntries.length;
    }
    
    function getEntry(uint256 _entryId) public view returns (DataEntry memory) {
        require(_entryId < dataEntries.length, "Entry does not exist");
        return dataEntries[_entryId];
    }
    
    function getLatestEntries(uint256 _count) public view returns (DataEntry[] memory) {
        uint256 total = dataEntries.length;
        if (_count > total) _count = total;
        if (_count == 0) {
            return new DataEntry[](0);
        }
        
        DataEntry[] memory latest = new DataEntry[](_count);
        for (uint256 i = 0; i < _count; i++) {
            latest[i] = dataEntries[total - 1 - i];
        }
        return latest;
    }
}