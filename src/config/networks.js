// Enhanced networks configuration with more tokens
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
        name: 'Tether USD',
        icon: '🔗',
        type: 'ERC20'
      },
      USDC: {
        address: '0xA0b86a33E6441E3b4Ca9BbD61D0b01faa9602C81',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
        icon: '🔵',
        type: 'ERC20'
      },
      DAI: {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        icon: '🟡',
        type: 'ERC20'
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
        name: 'Tether USD (Sepolia)',
        icon: '🔗',
        type: 'ERC20'
      },
      USDC: {
        address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin (Sepolia)',
        icon: '🔵',
        type: 'ERC20'
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
        name: 'Tether USD (BSC)',
        icon: '🔗',
        type: 'BEP20'
      },
      USDC: {
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        decimals: 18,
        symbol: 'USDC',
        name: 'USD Coin (BSC)',
        icon: '🔵',
        type: 'BEP20'
      },
      BUSD: {
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        decimals: 18,
        symbol: 'BUSD',
        name: 'Binance USD',
        icon: '🟨',
        type: 'BEP20'
      }
    }
  },
  polygon: {
    chainId: 137,
    name: 'Polygon 主网',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    tokens: {
      USDT: {
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD (Polygon)',
        icon: '🔗',
        type: 'ERC20'
      },
      USDC: {
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin (Polygon)',
        icon: '🔵',
        type: 'ERC20'
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

export const getTokensByChainId = (chainId) => {
  const network = getNetworkByChainId(chainId);
  return network?.tokens || {};
};