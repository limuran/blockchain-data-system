export const NETWORKS = {
  mainnet: {
    chainId: 1,
    name: '以太坊主网',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://cloudflare-eth.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    tokens: {
      USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD'
      }
    }
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia 测试网',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    tokens: {
      USDT: {
        address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD (Sepolia)'
      }
    }
  },
  bsc: {
    chainId: 56,
    name: 'BSC 主网',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com'],
    tokens: {
      USDT: {
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
        symbol: 'USDT',
        name: 'Tether USD (BSC)'
      }
    }
  }
};

export const DEFAULT_NETWORK = NETWORKS.sepolia;

export const getNetworkByChainId = (chainId) => {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
};

export const getSupportedNetworks = () => {
  return Object.values(NETWORKS);
};