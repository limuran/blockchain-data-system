// # Enhanced Token Configuration with Fixed Testnet Support
export const SUPPORTED_TOKENS = {
  // Ethereum Mainnet
  1: {
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      icon: '🔗',
      type: 'ERC20',
      isNative: false
    },
    USDC: {
      address: '0xA0b86a33E6441E3b4Ca9BbD61D0b01faa9602C81',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '🔵',
      type: 'ERC20',
      isNative: false
    },
    DAI: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      icon: '🟡',
      type: 'ERC20',
      isNative: false
    }
  },
  // Sepolia Testnet - 使用实际可用的测试代币
  11155111: {
    USDC: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Sepolia)',
      icon: '🔵',
      type: 'ERC20',
      isNative: false,
      testnet: true
    },
    LINK: {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      decimals: 18,
      symbol: 'LINK',
      name: 'Chainlink Token (Sepolia)',
      icon: '🔗',
      type: 'ERC20',
      isNative: false,
      testnet: true
    },
    UNI: {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      decimals: 18,
      symbol: 'UNI',
      name: 'Uniswap Token (Sepolia)',
      icon: '🦄',
      type: 'ERC20',
      isNative: false,
      testnet: true
    }
  },
  // BSC Mainnet
  56: {
    USDT: {
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      symbol: 'USDT',
      name: 'Tether USD (BSC)',
      icon: '🔗',
      type: 'BEP20',
      isNative: false
    },
    USDC: {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18,
      symbol: 'USDC',
      name: 'USD Coin (BSC)',
      icon: '🔵',
      type: 'BEP20',
      isNative: false
    },
    BUSD: {
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      decimals: 18,
      symbol: 'BUSD',
      name: 'Binance USD',
      icon: '🟨',
      type: 'BEP20',
      isNative: false
    }
  }
}

// Network configuration
export const NETWORK_CONFIG = {
  1: {
    name: 'Ethereum',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    isTestnet: false,
    hasUniswap: true,
    swapEnabled: true
  },
  11155111: {
    name: 'Sepolia',
    chainName: 'Sepolia Test Network',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    isTestnet: true,
    hasUniswap: false,
    swapEnabled: false // 禁用兑换功能，测试网流动性不足
  },
  56: {
    name: 'BSC',
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com'],
    isTestnet: false,
    hasUniswap: true,
    swapEnabled: true
  }
}

// Updated Router addresses
export const UNISWAP_ROUTER = {
  1: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Mainnet
  56: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4' // BSC (PancakeSwap)
}

// Updated Quoter V2 addresses
export const QUOTER_ADDRESSES = {
  1: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  56: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997'
}

// WETH addresses
export const WETH_ADDRESSES = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB on BSC
}

export const getTokensByChainId = (chainId) => {
  return SUPPORTED_TOKENS[chainId] || {}
}

export const getTokenBySymbol = (chainId, symbol) => {
  const tokens = getTokensByChainId(chainId)
  return tokens[symbol]
}

export const getUniswapRouter = (chainId) => {
  return UNISWAP_ROUTER[chainId]
}

export const getQuoterAddress = (chainId) => {
  return QUOTER_ADDRESSES[chainId]
}

export const getWETHAddress = (chainId) => {
  return WETH_ADDRESSES[chainId]
}

export const getNetworkConfig = (chainId) => {
  return (
    NETWORK_CONFIG[chainId] || {
      name: `Network ${chainId}`,
      isTestnet: false,
      hasUniswap: false,
      swapEnabled: false
    }
  )
}

export const getNetworkName = (chainId) => {
  return getNetworkConfig(chainId).name
}

export const isTestnet = (chainId) => {
  return getNetworkConfig(chainId).isTestnet
}

export const isSwapEnabled = (chainId) => {
  const config = getNetworkConfig(chainId)
  return config.hasUniswap && config.swapEnabled === true
}
