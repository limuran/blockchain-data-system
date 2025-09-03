import { ethers } from 'ethers';
import { getNetworkByChainId } from '../config/networks';

// 地址格式化
export const formatAddress = (address, chars = 4) => {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-chars)}`;
};

// 金额格式化
export const formatEther = (value, decimals = 4) => {
  try {
    return parseFloat(ethers.formatEther(value || 0)).toFixed(decimals);
  } catch (e) {
    return '0.0000';
  }
};

// 代币金额格式化
export const formatTokenAmount = (value, tokenDecimals, displayDecimals = 2) => {
  try {
    return parseFloat(ethers.formatUnits(value || 0, tokenDecimals)).toFixed(displayDecimals);
  } catch (e) {
    return '0.00';
  }
};

// Gas估算
export const estimateGasWithBuffer = (gasEstimate, bufferPercent = 20) => {
  return gasEstimate * BigInt(100 + bufferPercent) / BigInt(100);
};

// 检查交易状态
export const getTransactionStatus = async (hash, provider) => {
  try {
    const receipt = await provider.getTransactionReceipt(hash);
    return receipt ? (receipt.status ? 'success' : 'failed') : 'pending';
  } catch (e) {
    return 'unknown';
  }
};

// 获取区块浏览器URL
export const getExplorerUrl = (chainId, hash, type = 'tx') => {
  const network = getNetworkByChainId(chainId);
  if (!network || !network.blockExplorerUrls.length) {
    return `https://sepolia.etherscan.io/${type}/${hash}`;
  }
  return `${network.blockExplorerUrls[0]}/${type}/${hash}`;
};

// 验证以太坊地址
export const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

// 解码交易数据
export const decodeTransactionData = (data) => {
  if (!data || data === '0x') return null;
  
  try {
    return ethers.toUtf8String(data);
  } catch (e) {
    return data; // 返回原始数据如果无法解码
  }
};

// 编码数据为十六进制
export const encodeStringData = (str) => {
  return ethers.hexlify(ethers.toUtf8Bytes(str));
};

// 获取当前Gas价格
export const getCurrentGasPrice = async (provider) => {
  try {
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };
  } catch (e) {
    return null;
  }
};

// 生成随机测试地址
export const generateTestAddress = () => {
  return '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)).join('');
};

// 时间戳转换
export const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

// ENS解析
export const resolveENS = async (nameOrAddress, provider) => {
  try {
    if (nameOrAddress.endsWith('.eth')) {
      // 解析ENS到地址
      return await provider.resolveName(nameOrAddress);
    } else if (ethers.isAddress(nameOrAddress)) {
      // 反向解析地址到ENS
      return await provider.lookupAddress(nameOrAddress);
    }
    return null;
  } catch (e) {
    return null;
  }
};