import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenBalance, getETHBalance } from '../utils/tokenUtils';
import { getTokensByChainId } from '../config/tokens';

/**
 * Custom hook for managing token balances
 * @param {string} walletAddress - User's wallet address
 * @param {number} chainId - Current network chain ID
 * @returns {Object} Balances and utilities
 */
export const useTokenBalance = (walletAddress, chainId) => {
  const [balances, setBalances] = useState({});
  const [ethBalance, setEthBalance] = useState('0.000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const supportedTokens = getTokensByChainId(chainId);

  const fetchBalances = async () => {
    if (!walletAddress || !window.ethereum) {
      setBalances({});
      setEthBalance('0.000000');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Fetch ETH balance
      const ethBal = await getETHBalance(provider, walletAddress);
      setEthBalance(ethBal);
      
      // Fetch token balances
      const tokenBalances = {};
      const promises = Object.entries(supportedTokens).map(async ([symbol, token]) => {
        try {
          const balance = await getTokenBalance(
            provider, 
            token.address, 
            walletAddress, 
            token.decimals
          );
          tokenBalances[symbol] = balance;
        } catch (err) {
          console.error(`Error fetching ${symbol} balance:`, err);
          tokenBalances[symbol] = '0.000000';
        }
      });
      
      await Promise.all(promises);
      setBalances(tokenBalances);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = (tokenSymbol) => {
    if (tokenSymbol === 'ETH') {
      // Refresh ETH balance only
      if (walletAddress && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        getETHBalance(provider, walletAddress)
          .then(setEthBalance)
          .catch(console.error);
      }
    } else if (supportedTokens[tokenSymbol]) {
      // Refresh specific token balance
      if (walletAddress && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const token = supportedTokens[tokenSymbol];
        getTokenBalance(provider, token.address, walletAddress, token.decimals)
          .then(balance => {
            setBalances(prev => ({ ...prev, [tokenSymbol]: balance }));
          })
          .catch(console.error);
      }
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [walletAddress, chainId]);

  return {
    balances,
    ethBalance,
    loading,
    error,
    fetchBalances,
    refreshBalance,
    supportedTokens
  };
};