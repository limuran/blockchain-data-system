import { ethers } from 'ethers';
import { getUniswapRouter, getWETHAddress } from '../config/tokens';

// Uniswap V3 SwapRouter ABI (simplified)
const UNISWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)'
];

// QuoteV2 contract ABI for getting quotes
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)'
];

const QUOTER_ADDRESSES = {
  1: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  11155111: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
  56: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997'
};

/**
 * Get a quote for swapping ETH to a token
 */
export const getSwapQuote = async (provider, chainId, tokenOut, amountIn) => {
  try {
    const quoterAddress = QUOTER_ADDRESSES[chainId];
    if (!quoterAddress) {
      throw new Error('Quoter not available for this network');
    }

    const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider);
    const wethAddress = getWETHAddress(chainId);
    
    const quote = await quoter.quoteExactInputSingle(
      wethAddress,
      tokenOut,
      3000, // 0.3% fee tier
      amountIn,
      0
    );
    
    return quote.toString();
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw error;
  }
};

/**
 * Swap ETH for tokens using Uniswap V3
 */
export const swapETHForToken = async (signer, chainId, tokenOut, amountIn, amountOutMinimum, recipient) => {
  try {
    const routerAddress = getUniswapRouter(chainId);
    if (!routerAddress) {
      throw new Error('Uniswap router not available for this network');
    }

    const router = new ethers.Contract(routerAddress, UNISWAP_ROUTER_ABI, signer);
    const wethAddress = getWETHAddress(chainId);
    
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    
    const params = {
      tokenIn: wethAddress,
      tokenOut: tokenOut,
      fee: 3000, // 0.3% fee tier
      recipient: recipient,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum,
      sqrtPriceLimitX96: 0
    };
    
    const tx = await router.exactInputSingle(params, {
      value: amountIn
    });
    
    return tx;
  } catch (error) {
    console.error('Error swapping ETH for token:', error);
    throw error;
  }
};

/**
 * Calculate the amount of ETH needed to get a specific amount of tokens
 */
export const calculateETHForTokens = async (provider, chainId, tokenOut, amountOut) => {
  try {
    const quoterAddress = QUOTER_ADDRESSES[chainId];
    if (!quoterAddress) {
      throw new Error('Quoter not available for this network');
    }

    const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider);
    const wethAddress = getWETHAddress(chainId);
    
    // For exactOutput, we need a different quoter method
    // This is a simplified approach - in production, you'd use quoterV2
    const estimatedInput = ethers.parseEther('0.1'); // Start with 0.1 ETH estimate
    const quote = await quoter.quoteExactInputSingle(
      wethAddress,
      tokenOut,
      3000,
      estimatedInput,
      0
    );
    
    // Calculate ratio and estimate required input
    const ratio = estimatedInput * BigInt(amountOut) / quote;
    return (ratio * BigInt(110) / BigInt(100)).toString(); // Add 10% slippage
  } catch (error) {
    console.error('Error calculating ETH for tokens:', error);
    throw error;
  }
};