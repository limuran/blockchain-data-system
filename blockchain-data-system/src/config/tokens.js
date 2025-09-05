// # Enhanced Token Configuration
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
    },
    FRAX: {
      address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
      decimals: 18,
      symbol: 'FRAX',
      name: 'Frax',
      icon: '❄️',
      type: 'ERC20',
      isNative: false
    }
  },
  // Sepolia Testnet
  11155111: {
    USDT: {
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD (Sepolia)',
      icon: '🔗',
      type: 'ERC20',
      isNative: false
    },
    USDC: {
      address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Sepolia)',
      icon: '🔵',
      type: 'ERC20',
      isNative: false
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

// Uniswap V3 Router addresses
export const UNISWAP_ROUTER = {
  1: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Mainnet
  11155111: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E', // Sepolia
  56: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4' // BSC (PancakeSwap)
}

// Quoter V2 addresses for getting swap quotes
export const QUOTER_ADDRESSES = {
  1: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  11155111: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
  56: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997'
}

// WETH addresses for swapping
export const WETH_ADDRESSES = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  11155111: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB on BSC
}

// Network names for display
export const NETWORK_NAMES = {
  1: 'Ethereum',
  11155111: 'Sepolia',
  56: 'BSC'
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

export const getNetworkName = (chainId) => {
  return NETWORK_NAMES[chainId] || `Network ${chainId}`
}
