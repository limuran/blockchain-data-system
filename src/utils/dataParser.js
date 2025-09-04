// 数据解析工具

export const parseTransactionData = (rawData) => {
  if (!rawData || rawData === '0x' || rawData === '无数据') {
    return {
      type: 'empty',
      preview: '无数据',
      fullContent: '无数据',
      size: 0
    };
  }

  // 处理"无法解码"消息
  if (rawData.includes('无法解码')) {
    return {
      type: 'binary',
      preview: '二进制数据 (无法解码为UTF-8)',
      fullContent: rawData,
      size: rawData.length
    };
  }

  // 十六进制数据处理
  if (rawData.startsWith('0x') && rawData.length > 10) {
    const byteLength = (rawData.length - 2) / 2;
    
    // 尝试解码为UTF-8文本
    try {
      const decoded = ethers.toUtf8String(rawData);
      if (decoded && /[\x20-\x7E\u4e00-\u9fff]/.test(decoded)) {
        return {
          type: 'text',
          preview: decoded.length > 50 ? decoded.slice(0, 50) + '...' : decoded,
          fullContent: decoded,
          hexData: rawData,
          size: decoded.length
        };
      }
    } catch (e) {
      // 解码失败，作为二进制处理
    }
    
    return {
      type: 'hex',
      preview: `十六进制数据 (${byteLength} 字节)`,
      fullContent: rawData,
      size: byteLength
    };
  }

  // 普通文本
  return {
    type: 'text',
    preview: rawData.length > 50 ? rawData.slice(0, 50) + '...' : rawData,
    fullContent: rawData,
    size: rawData.length
  };
};

export const formatDataDisplay = (parsedData) => {
  const typeLabels = {
    empty: { emoji: '🚫', label: '无数据', color: 'text-gray-400' },
    binary: { emoji: '📦', label: '二进制', color: 'text-purple-600' },
    hex: { emoji: '🔢', label: '十六进制', color: 'text-orange-600' },
    text: { emoji: '📝', label: '文本', color: 'text-green-600' },
    text_chinese: { emoji: '🀄', label: '中文文本', color: 'text-blue-600' }
  };

  const typeInfo = typeLabels[parsedData.type] || typeLabels.text;
  
  return {
    ...typeInfo,
    ...parsedData
  };
};

export const detectDataType = (data) => {
  if (!data) return 'unknown';
  
  // 合约调用数据
  if (data.startsWith('0xa9059cbb')) return 'erc20_transfer';
  if (data.startsWith('0x23b872dd')) return 'erc20_transferFrom';
  if (data.startsWith('0x095ea7b3')) return 'erc20_approve';
  
  // NFT相关
  if (data.startsWith('0x42842e0e')) return 'erc721_safeTransferFrom';
  if (data.startsWith('0x23b872dd')) return 'erc721_transferFrom';
  
  // 自定义合约
  if (data.startsWith('0x')) {
    const methodId = data.slice(0, 10);
    const knownMethods = {
      '0x4ed3885e': 'setResolver',
      '0x8da5cb5b': 'owner',
      '0xf2fde38b': 'transferOwnership'
    };
    
    if (knownMethods[methodId]) {
      return knownMethods[methodId];
    }
  }
  
  return 'contract_call';
};

// 导出ethers以供使用
import { ethers } from 'ethers';
export { ethers };