import { ethers } from 'ethers';
import { deployDataStorageContract, validateContract, getContractInfo } from './contractDeployment';

// 合约服务类
export class ContractService {
  constructor(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
    this.contracts = {};
  }

  // 设置签名者
  setSigner(signer) {
    this.signer = signer;
  }

  // 部署新合约
  async deployContract() {
    if (!this.signer) {
      throw new Error('需要钱包签名者来部署合约');
    }
    
    return await deployDataStorageContract(this.signer);
  }

  // 连接到现有合约
  async connectToContract(contractAddress) {
    const info = await getContractInfo(contractAddress, this.provider);
    
    if (info.isValid) {
      this.contracts[contractAddress] = info.contract;
    }
    
    return info;
  }

  // 存储数据
  async storeData(contractAddress, data, dataType) {
    if (!this.signer) {
      throw new Error('需要钱包签名者来写入数据');
    }

    const contract = this.contracts[contractAddress];
    if (!contract) {
      throw new Error('请先连接到合约');
    }

    try {
      // 连接签名者
      const contractWithSigner = contract.connect(this.signer);
      
      // 估算Gas
      const gasEstimate = await contractWithSigner.storeData.estimateGas(data, dataType);
      
      // 执行交易
      const tx = await contractWithSigner.storeData(data, dataType, {
        gasLimit: gasEstimate * 120n / 100n // 增加20%缓冲
      });
      
      console.log('📝 数据存储交易已发送:', tx.hash);
      
      // 等待确认
      const receipt = await tx.wait();
      
      console.log('✅ 数据存储确认:', receipt);
      
      return {
        success: true,
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        receipt: receipt
      };
    } catch (error) {
      console.error('❌ 数据存储失败:', error);
      throw new Error('数据存储失败: ' + error.message);
    }
  }

  // 获取用户数据
  async getUserData(contractAddress, userAddress) {
    const contract = this.contracts[contractAddress];
    if (!contract) {
      const info = await this.connectToContract(contractAddress);
      if (!info.isValid) {
        throw new Error(info.error);
      }
    }

    try {
      const userData = await this.contracts[contractAddress].getUserData(userAddress);
      return userData.map(entry => ({
        user: entry.user,
        data: entry.data,
        timestamp: Number(entry.timestamp),
        dataType: entry.dataType,
        blockNumber: Number(entry.blockNumber),
        dataHash: entry.dataHash
      }));
    } catch (error) {
      console.error('❌ 获取用户数据失败:', error);
      throw new Error('获取用户数据失败: ' + error.message);
    }
  }

  // 获取最新数据
  async getLatestData(contractAddress, count = 10) {
    const contract = this.contracts[contractAddress];
    if (!contract) {
      const info = await this.connectToContract(contractAddress);
      if (!info.isValid) {
        throw new Error(info.error);
      }
    }

    try {
      const latestData = await this.contracts[contractAddress].getLatestData(count);
      return latestData.map(entry => ({
        user: entry.user,
        data: entry.data,
        timestamp: Number(entry.timestamp),
        dataType: entry.dataType,
        blockNumber: Number(entry.blockNumber),
        dataHash: entry.dataHash
      }));
    } catch (error) {
      console.error('❌ 获取最新数据失败:', error);
      throw new Error('获取最新数据失败: ' + error.message);
    }
  }

  // 获取合约统计信息
  async getContractStats(contractAddress) {
    const contract = this.contracts[contractAddress];
    if (!contract) {
      const info = await this.connectToContract(contractAddress);
      if (!info.isValid) {
        throw new Error(info.error);
      }
    }

    try {
      const stats = await this.contracts[contractAddress].getStats();
      return {
        totalEntries: Number(stats.totalEntries),
        totalUsers: Number(stats.totalUsers),
        latestBlockNumber: Number(stats.latestBlockNumber)
      };
    } catch (error) {
      console.error('❌ 获取合约统计失败:', error);
      throw new Error('获取合约统计失败: ' + error.message);
    }
  }
}

// 创建全局合约服务实例
let contractService = null;

export const getContractService = (provider, signer = null) => {
  if (!contractService) {
    contractService = new ContractService(provider, signer);
  } else {
    if (signer) contractService.setSigner(signer);
  }
  return contractService;
};

export const resetContractService = () => {
  contractService = null;
};