import { ethers } from 'ethers';

// Standard ERC20 ABI with all necessary functions
export const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function totalSupply() external view returns (uint256)'
];

/**
 * Get token balance for an address
 */
export const getTokenBalance = async (provider, tokenAddress, walletAddress, decimals) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(walletAddress);
    return parseFloat(ethers.formatUnits(balance, decimals)).toFixed(6);
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return '0.000000';
  }
};

/**
 * Get ETH balance for an address
 */
export const getETHBalance = async (provider, walletAddress) => {
  try {
    const balance = await provider.getBalance(walletAddress);
    return parseFloat(ethers.formatEther(balance)).toFixed(6);
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    return '0.000000';
  }
};

/**
 * Check if token needs approval for a specific spender
 */
export const checkTokenApproval = async (provider, tokenAddress, owner, spender, amount) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const allowance = await contract.allowance(owner, spender);
    const amountBigInt = BigInt(amount);
    const needsApproval = allowance < amountBigInt;
    
    return {
      needsApproval,
      currentAllowance: allowance.toString(),
      hasInfiniteApproval: allowance >= ethers.MaxUint256 / BigInt(2) // Check if it's a very large approval
    };
  } catch (error) {
    console.error('Error checking token approval:', error);
    return {
      needsApproval: true,
      currentAllowance: '0',
      hasInfiniteApproval: false
    };
  }
};

/**
 * Approve token spending with smart approval strategy
 */
export const approveToken = async (signer, tokenAddress, spender, amount, useInfiniteApproval = true) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Use infinite approval for better UX (avoid repeated approvals)
    const approvalAmount = useInfiniteApproval ? ethers.MaxUint256 : amount;
    
    // Estimate gas first
    const gasEstimate = await contract.approve.estimateGas(spender, approvalAmount);
    
    const tx = await contract.approve(spender, approvalAmount, {
      gasLimit: gasEstimate * BigInt(120) / BigInt(100) // 20% buffer
    });
    
    return tx;
  } catch (error) {
    console.error('Error approving token:', error);
    throw error;
  }
};

/**
 * Transfer tokens with gas estimation
 */
export const transferToken = async (signer, tokenAddress, to, amount) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Estimate gas first
    const gasEstimate = await contract.transfer.estimateGas(to, amount);
    
    const tx = await contract.transfer(to, amount, {
      gasLimit: gasEstimate * BigInt(120) / BigInt(100) // 20% buffer
    });
    
    return tx;
  } catch (error) {
    console.error('Error transferring token:', error);
    throw error;
  }
};

/**
 * Get gas estimate for token transfer
 */
export const estimateTransferGas = async (provider, tokenAddress, from, to, amount) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const gasEstimate = await contract.transfer.estimateGas(to, amount, { from });
    return gasEstimate.toString();
  } catch (error) {
    console.error('Error estimating gas for transfer:', error);
    return '100000'; // Fallback gas estimate
  }
};

/**
 * Get gas estimate for token approval
 */
export const estimateApprovalGas = async (provider, tokenAddress, spender, amount, from) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const gasEstimate = await contract.approve.estimateGas(spender, amount, { from });
    return gasEstimate.toString();
  } catch (error) {
    console.error('Error estimating gas for approval:', error);
    return '50000'; // Fallback gas estimate
  }
};

/**
 * Get token info (name, symbol, decimals)
 */
export const getTokenInfo = async (provider, tokenAddress) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);
    
    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString()
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
};

/**
 * Batch get multiple token balances
 */
export const batchGetTokenBalances = async (provider, tokenAddresses, walletAddress, decimalsArray) => {
  try {
    const balancePromises = tokenAddresses.map((address, index) => 
      getTokenBalance(provider, address, walletAddress, decimalsArray[index])
    );
    
    const balances = await Promise.all(balancePromises);
    return balances;
  } catch (error) {
    console.error('Error batch fetching token balances:', error);
    return tokenAddresses.map(() => '0.000000');
  }
};