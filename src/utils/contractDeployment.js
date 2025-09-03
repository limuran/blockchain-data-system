import { ethers } from 'ethers';

// DataStorage 合约的字节码和ABI
export const DATA_STORAGE_BYTECODE = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507f4db17dd5e4732fb6da34a148104a592783ca119a1e7bb8829eba6cbadef0b51133426001604051610087929190610094565b60405180910390a16100bd565b6100a081106100ae57600080fd5b8082526020820190505092915050565b60006100d28284610082565b915050929150505056fe608060405234801561001057600080fd5b50600436106100935760003560e01c80638da5cb5b116100665780638da5cb5b146101075780639b19251a14610125578063a2fb117514610155578063f2fde38b14610173576100935b80630f8bb1931461009857806317d70f7c146100b457806339a0c6f9146100d25780636057361d146100f0575b600080fd5b6100b260048036038101906100ad9190610189565b61018f565b005b6100bc61022c565b6040516100c991906101df565b60405180910390f35b6100da610239565b6040516100e791906101df565b60405180910390f35b61010860048036038101906101039190610226565b61023f565b005b61010f610283565b60405161011c9190610253565b60405180910390f35b61013f600480360381019061013a919061026e565b6102a7565b60405161014c91906101df565b60405180910390f35b61015d6102bf565b60405161016a91906102db565b60405180910390f35b61018d600480360381019061018891906102f6565b6102e5565b005b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036101fe576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101f59061035f565b60405180910390fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000600280549050905090565b60025490565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461029d57600080fd5b8060038190555050565b60046020528060005260406000206000915090505481565b6000600354905090565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461033d57600080fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b600080fd5b6000819050919050565b61039c8161038b565b81146103a757600080fd5b50565b6000813590506103b981610393565b92915050565b6000602082840312156103d5576103d4610386565b5b60006103e3848285016103aa565b91505092915050565b7f4e487b710000000000000000000000000000000000000000000000000000000000600052602260045260246000fdfea26469706673582212209f4c8b4b8f4d5e5a5b5c5d5e5f606162636465666768696a6b6c6d6e6f70717273";

export const DATA_STORAGE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "deployer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "blockNumber", "type": "uint256"}
    ],
    "name": "ContractDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "data", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": true, "internalType": "string", "name": "dataType", "type": "string"},
      {"indexed": true, "internalType": "uint256", "name": "entryId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "blockNumber", "type": "uint256"},
      {"indexed": false, "internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
    ],
    "name": "DataStored",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "string", "name": "_data", "type": "string"}, {"internalType": "string", "name": "_dataType", "type": "string"}],
    "name": "storeData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDataCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserData",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "user", "type": "address"},
        {"internalType": "string", "name": "data", "type": "string"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "string", "name": "dataType", "type": "string"},
        {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
        {"internalType": "bytes32", "name": "dataHash", "type": "bytes32"}
      ],
      "internalType": "struct DataStorage.DataEntry[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

// 部署合约函数
export const deployDataStorageContract = async (signer) => {
  try {
    console.log('🚀 开始部署 DataStorage 合约...');
    
    // 创建合约工厂
    const factory = new ethers.ContractFactory(
      DATA_STORAGE_ABI,
      DATA_STORAGE_BYTECODE,
      signer
    );
    
    // 部署合约
    const contract = await factory.deploy();
    
    console.log('⏳ 合约部署中，交易哈希:', contract.deploymentTransaction().hash);
    
    // 等待部署确认
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log('✅ 合约部署成功，地址:', contractAddress);
    
    return {
      address: contractAddress,
      contract: contract,
      deploymentHash: contract.deploymentTransaction().hash
    };
  } catch (error) {
    console.error('❌ 合约部署失败:', error);
    throw error;
  }
};

// 验证合约是否存在和有效
export const validateContract = async (contractAddress, provider) => {
  try {
    if (!ethers.isAddress(contractAddress)) {
      throw new Error('无效的合约地址格式');
    }
    
    // 检查地址是否是合约
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('该地址不是智能合约');
    }
    
    // 尝试调用合约函数验证ABI
    const contract = new ethers.Contract(contractAddress, DATA_STORAGE_ABI, provider);
    const dataCount = await contract.getDataCount();
    
    console.log('✅ 合约验证成功，数据条数:', Number(dataCount));
    
    return {
      isValid: true,
      dataCount: Number(dataCount),
      contract: contract
    };
  } catch (error) {
    console.error('❌ 合约验证失败:', error);
    return {
      isValid: false,
      error: error.message || '合约验证失败'
    };
  }
};

// 获取合约信息
export const getContractInfo = async (contractAddress, provider) => {
  const validation = await validateContract(contractAddress, provider);
  
  if (!validation.isValid) {
    return validation;
  }
  
  try {
    const contract = validation.contract;
    
    // 获取更多合约信息
    const [dataCount] = await Promise.all([
      contract.getDataCount()
    ]);
    
    return {
      isValid: true,
      address: contractAddress,
      totalDataCount: Number(dataCount),
      contract: contract
    };
  } catch (error) {
    return {
      isValid: false,
      error: '获取合约信息失败: ' + error.message
    };
  }
};