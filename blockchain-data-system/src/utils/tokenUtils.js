import { ethers } from 'ethers';

// Standard ERC20 ABI
export const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
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
 * Check if token needs approval
 */
export const checkTokenApproval = async (provider, tokenAddress, owner, spender, amount) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const allowance = await contract.allowance(owner, spender);
    const needsApproval = allowance < BigInt(amount);
    
    return {
      needsApproval,
      currentAllowance: allowance.toString()
    };
  } catch (error) {
    console.error('Error checking token approval:', error);
    return {
      needsApproval: true,
      currentAllowance: '0'
    };
  }
};

/**
 * Approve token spending
 */
export const approveToken = async (signer, tokenAddress, spender, amount) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.approve(spender, amount);
    return tx;
  } catch (error) {
    console.error('Error approving token:', error);
    throw error;
  }
};

/**
 * Transfer tokens
 */
export const transferToken = async (signer, tokenAddress, to, amount) => {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.transfer(to, amount);
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