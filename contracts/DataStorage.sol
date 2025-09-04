// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract DataStorage {
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
    mapping(address => uint256[]) public userEntries;
    mapping(string => uint256[]) public typeEntries;

    address public owner;

    // 🔥 关键：定义事件
    event DataStored(
        address indexed user,
        string data,
        uint256 timestamp,
        string dataType,
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

        // 🔥 发出部署事件
        emit ContractDeployed(msg.sender, block.timestamp, block.number);
    }

    // 🔥 关键：存储数据时发出事件
    function storeData(string memory data, string memory dataType) public {
        require(bytes(data).length > 0, "Data cannot be empty");
        require(bytes(dataType).length > 0, "Data type cannot be empty");

        uint256 entryId = dataEntries.length;
        bytes32 dataHash = keccak256(
            abi.encodePacked(data, dataType, msg.sender, block.timestamp)
        );

        DataEntry memory newEntry = DataEntry({
            user: msg.sender,
            data: data,
            timestamp: block.timestamp,
            dataType: dataType,
            entryId: entryId,
            blockNumber: block.number,
            dataHash: dataHash
        });

        dataEntries.push(newEntry);
        userEntries[msg.sender].push(entryId);
        typeEntries[dataType].push(entryId);

        // 🔥 关键：发出事件！
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

    // 查询函数
    function getDataCount() public view returns (uint256) {
        return dataEntries.length;
    }

    function getUserDataCount(address user) public view returns (uint256) {
        return userEntries[user].length;
    }

    function getDataByType(
        string memory dataType
    ) public view returns (uint256[] memory) {
        return typeEntries[dataType];
    }

    function getUserEntries(
        address user
    ) public view returns (uint256[] memory) {
        return userEntries[user];
    }

    function getEntry(uint256 entryId) public view returns (DataEntry memory) {
        require(entryId < dataEntries.length, "Entry does not exist");
        return dataEntries[entryId];
    }

    // 批量查询最新数据
    function getLatestEntries(
        uint256 count
    ) public view returns (DataEntry[] memory) {
        require(count > 0, "Count must be greater than 0");

        uint256 total = dataEntries.length;
        if (count > total) count = total;

        DataEntry[] memory latest = new DataEntry[](count);

        for (uint256 i = 0; i < count; i++) {
            latest[i] = dataEntries[total - 1 - i];
        }

        return latest;
    }
}
