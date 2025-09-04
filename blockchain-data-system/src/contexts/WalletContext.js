import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORKS } from '../config/networks';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({
    address: null,
    ensName: null,
    ensAvatar: null,
    ethBalance: '0.00',
    usdtBalance: '0.00',
    chainId: null,
    chainName: null
  });

  const [isConnecting, setIsConnecting] = useState(false);

  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId) => {
        updateNetworkInfo(parseInt(chainId, 16));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // 更新网络信息
  const updateNetworkInfo = async (chainId) => {
    const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
    setWallet(prev => ({
      ...prev,
      chainId,
      chainName: network ? network.name : `未知网络 (${chainId})`
    }));
  };

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('请安装 MetaMask 钱包');
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (!accounts.length) {
        throw new Error('用户拒绝连接');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const address = accounts[0];
      const network = await provider.getNetwork();
      
      await updateNetworkInfo(Number(network.chainId));

      // ENS查询（在主网进行）
      let ensName = null, ensAvatar = null;
      try {
        const mainnetProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
        ensName = await mainnetProvider.lookupAddress(address);
        if (ensName) {
          const resolver = await mainnetProvider.getResolver(ensName);
          if (resolver) {
            ensAvatar = await resolver.getAvatar();
          }
        }
      } catch (e) {
        console.log('ENS查询失败:', e.message);
      }

      // 查询ETH余额
      const ethBalance = await provider.getBalance(address);
      const ethFormatted = parseFloat(ethers.formatEther(ethBalance)).toFixed(4);

      // 查询USDT余额
      let usdtFormatted = '0.00';
      const currentNetwork = Object.values(NETWORKS).find(n => n.chainId === Number(network.chainId));
      if (currentNetwork && currentNetwork.tokens.USDT) {
        try {
          const usdtContract = new ethers.Contract(
            currentNetwork.tokens.USDT.address,
            ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
            provider
          );
          const balance = await usdtContract.balanceOf(address);
          const decimals = await usdtContract.decimals();
          usdtFormatted = parseFloat(ethers.formatUnits(balance, decimals)).toFixed(2);
        } catch (e) {
          console.log('USDT余额查询失败:', e.message);
        }
      }

      setWallet({
        address,
        ensName,
        ensAvatar,
        ethBalance: ethFormatted,
        usdtBalance: usdtFormatted,
        chainId: Number(network.chainId),
        chainName: currentNetwork ? currentNetwork.name : `链 ${network.chainId}`
      });

      return true;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      ensName: null,
      ensAvatar: null,
      ethBalance: '0.00',
      usdtBalance: '0.00',
      chainId: null,
      chainName: null
    });
  };

  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return false;

    const network = Object.values(NETWORKS).find(n => n.chainId === targetChainId);
    if (!network) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls
            }]
          });
          return true;
        } catch (addError) {
          console.error('添加网络失败:', addError);
          return false;
        }
      }
      console.error('切换网络失败:', error);
      return false;
    }
  };

  const value = {
    wallet,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};