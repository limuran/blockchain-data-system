// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// 🧪 简单测试合约 - 确保事件能够正确发出
contract EventTestContract {
    // 简化的事件定义
    event DataStored(
        address indexed user,
        string data,
        uint256 timestamp,
        string dataType,
        uint256 indexed entryId,
        uint256 blockNumber,
        bytes32 dataHash
    );

    event TestEvent(address indexed sender, string message);

    uint256 public dataCount = 0;

    constructor() {
        // 构造函数中发出测试事件
        emit TestEvent(msg.sender, "Contract deployed successfully!");
    }

    // 极简版本的 storeData 函数
    function storeData(string memory _data, string memory _dataType) public {
        dataCount++;

        // 🔥 立即发出事件 - 使用最简单的方式
        emit DataStored(
            msg.sender, // indexed address user
            _data, // string data
            block.timestamp, // uint256 timestamp
            _dataType, // string dataType
            dataCount, // indexed uint256 entryId
            block.number, // uint256 blockNumber
            keccak256(abi.encodePacked(_data)) // bytes32 dataHash
        );

        // 额外的测试事件
        emit TestEvent(msg.sender, string(abi.encodePacked("Stored: ", _data)));
    }

    // 简单的查询函数
    function getDataCount() public view returns (uint256) {
        return dataCount;
    }
}
