// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract RedPackage {
    // 定义一个发红包的主体是谁
    address payable public xxx;
    // 定义一个红包的总金额
    uint256 public totalAmount;
    // 定义要发多少个
    uint256 public count;
    // 是否是均等红包
    bool public isEqual;
    mapping(address => uint256) public isGrabbed;
    constructor(uint256 c, bool _isEqual) payable {
        require(msg.value > 0, "amount must >0");
        count = c;
        xxx = payable(msg.sender);
        isEqual = _isEqual;
        totalAmount = msg.value;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    // 给合约存钱
    function deposit() public payable {}

    function getRedPacket() public {
        require(count > 0, "red packet is empty");
        require(totalAmount > 0, "totalAmount must > 0");
        require(isGrabbed[msg.sender] == 0, "you have grabbed");
        isGrabbed[msg.sender] = 1;
        if (count == 1) {
            payable(msg.sender).transfer(totalAmount);
        } else {
            // 均等红包
            if (isEqual) {
                // 每个人分多少钱
                uint256 amount = totalAmount / count;
                // 给当前调这个合约的人转过去
                payable(msg.sender).transfer(amount);
                totalAmount -= amount;
            } else {
                // 不均分红包，随机数
            }
            count--;
        }
    }
}
