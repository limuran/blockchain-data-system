import { ethers } from 'ethers';
import { getUniswapRouter, getWETHAddress, getQuoterAddress } from '../config/tokens';

// Uniswap V3 SwapRouter ABI (essential functions)
const UNISWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)',
  'function refundETH() external payable',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable'
];

// QuoteV2 contract ABI for getting accurate quotes
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external view returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
];

// Fee tiers for different pools (0.05%, 0.3%, 1%)
const FEE_TIERS = [500, 3000, 10000];

/**
 * Get the best quote across different fee tiers
 */
export const getBestSwapQuote = async (provider, chainId, tokenIn, tokenOut, amountIn, isExactInput = true) => {
  try {
    const quoterAddress = getQuoterAddress(chainId);
    if (!quoterAddress) {
      throw new Error('Quoter not available for this network');
    }

    const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider);
    
    let bestQuote = null;
    let bestFee = 3000; // Default to 0.3%
    
    // Try different fee tiers to find the best rate
    for (const fee of FEE_TIERS) {
      try {
        let result;
        if (isExactInput) {
          result = await quoter.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            0
          );
        } else {
          result = await quoter.quoteExactOutputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn, // This is amountOut when isExactInput is false
            0
          );
        }
        
        const quote = {
          amountOut: isExactInput ? result[0].toString() : result[0].toString(),
          fee,
          gasEstimate: result[3].toString(),
          sqrtPriceX96After: result[1].toString()
        };
        
        // Compare quotes (higher output for exact input, lower input for exact output)
        if (!bestQuote || 
            (isExactInput && BigInt(quote.amountOut) > BigInt(bestQuote.amountOut)) ||
            (!isExactInput && BigInt(quote.amountOut) < BigInt(bestQuote.amountOut))) {
          bestQuote = quote;
          bestFee = fee;
        }
      } catch (error) {
        console.log(`Fee tier ${fee} failed:`, error.message);
        continue;
      }
    }
    
    if (!bestQuote) {
      throw new Error('No valid quotes found across fee tiers');
    }
    
    return {
      ...bestQuote,
      bestFee
    };
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw error;
  }
};

/**
 * Get a quote for swapping ETH to a token
 */
export const getSwapQuote = async (provider, chainId, tokenOut, amountIn) => {
  try {
    const wethAddress = getWETHAddress(chainId);
    const quote = await getBestSwapQuote(provider, chainId, wethAddress, tokenOut, amountIn, true);
    
    return quote.amountOut;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw error;
  }
};

/**
 * Calculate the amount of ETH needed to get a specific amount of tokens
 */
export const calculateETHForTokens = async (provider, chainId, tokenOut, amountOut) => {
  try {
    const wethAddress = getWETHAddress(chainId);
    const quote = await getBestSwapQuote(provider, chainId, wethAddress, tokenOut, amountOut, false);
    
    // Add 5% slippage buffer
    const amountInWithSlippage = BigInt(quote.amountOut) * BigInt(105) / BigInt(100);
    
    return amountInWithSlippage.toString();
  } catch (error) {
    console.error('Error calculating ETH for tokens:', error);
    throw error;
  }
};

/**
 * Swap ETH for tokens using Uniswap V3 with better error handling
 */
export const swapETHForToken = async (signer, chainId, tokenOut, amountIn, amountOutMinimum, recipient, slippage = 5) => {
  try {
    const routerAddress = getUniswapRouter(chainId);
    if (!routerAddress) {
      throw new Error('Uniswap router not available for this network');
    }

    const router = new ethers.Contract(routerAddress, UNISWAP_ROUTER_ABI, signer);
    const wethAddress = getWETHAddress(chainId);
    
    // Get the best fee tier for this swap
    const provider = signer.provider;
    const quote = await getBestSwapQuote(provider, chainId, wethAddress, tokenOut, amountIn, true);
    
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    
    const params = {
      tokenIn: wethAddress,
      tokenOut: tokenOut,
      fee: quote.bestFee,
      recipient: recipient,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum,
      sqrtPriceLimitX96: 0
    };
    
    // Estimate gas for the swap
    const gasEstimate = await router.exactInputSingle.estimateGas(params, {
      value: amountIn
    });
    
    const tx = await router.exactInputSingle(params, {
      value: amountIn,
      gasLimit: gasEstimate * BigInt(120) / BigInt(100) // 20% buffer
    });
    
    return tx;
  } catch (error) {
    console.error('Error swapping ETH for token:', error);
    
    // Provide more specific error messages
    if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
      throw new Error('滑点过高，请增加滑点容忍度或减少交易金额');
    } else if (error.message.includes('EXPIRED')) {
      throw new Error('交易已过期，请重试');
    } else if (error.message.includes('INSUFFICIENT_INPUT_AMOUNT')) {
      throw new Error('输入金额不足，请增加ETH数量');
    }
    
    throw error;
  }
};

/**
 * Get swap transaction parameters for MetaMask
 */
export const getSwapTransactionParams = async (provider, chainId, tokenOut, amountIn, recipient, slippage = 5) => {
  try {
    const routerAddress = getUniswapRouter(chainId);
    const wethAddress = getWETHAddress(chainId);
    
    // Get best quote
    const quote = await getBestSwapQuote(provider, chainId, wethAddress, tokenOut, amountIn, true);
    
    // Calculate minimum amount out with slippage
    const amountOutMinimum = BigInt(quote.amountOut) * BigInt(100 - slippage) / BigInt(100);
    
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    const params = {
      tokenIn: wethAddress,
      tokenOut: tokenOut,
      fee: quote.bestFee,
      recipient: recipient,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum.toString(),
      sqrtPriceLimitX96: 0
    };
    
    // Encode the function call
    const router = new ethers.Contract(routerAddress, UNISWAP_ROUTER_ABI, provider);
    const data = router.interface.encodeFunctionData('exactInputSingle', [params]);
    
    return {
      to: routerAddress,
      data: data,
      value: amountIn,
      gasEstimate: quote.gasEstimate,
      expectedOutput: quote.amountOut,
      minimumOutput: amountOutMinimum.toString(),
      fee: quote.bestFee,
      priceImpact: calculatePriceImpact(amountIn, quote.amountOut, quote.bestFee)
    };
  } catch (error) {
    console.error('Error getting swap transaction params:', error);
    throw error;
  }
};

/**
 * Calculate price impact for a swap
 */
const calculatePriceImpact = (amountIn, amountOut, fee) => {
  try {
    // This is a simplified calculation
    // In production, you'd want to use the current pool price vs execution price
    const feeImpact = fee / 10000; // Convert fee to percentage
    return (feeImpact * 100).toFixed(2); // Return as percentage string
  } catch (error) {
    return '0.00';
  }
};

/**
 * Check if swap is possible and get route info
 */
export const checkSwapRoute = async (provider, chainId, tokenIn, tokenOut, amountIn) => {
  try {
    const quote = await getBestSwapQuote(provider, chainId, tokenIn, tokenOut, amountIn, true);
    
    return {
      isAvailable: true,
      expectedOutput: quote.amountOut,
      fee: quote.bestFee,
      gasEstimate: quote.gasEstimate,
      priceImpact: calculatePriceImpact(amountIn, quote.amountOut, quote.bestFee)
    };
  } catch (error) {
    return {
      isAvailable: false,
      error: error.message
    };
  }
};