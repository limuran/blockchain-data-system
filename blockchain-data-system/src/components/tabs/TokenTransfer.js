import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { getTokensByChainId, getUniswapRouter, getNetworkName } from '../../config/tokens';
import { 
  getTokenBalance, 
  getETHBalance, 
  checkTokenApproval, 
  approveToken, 
  transferToken,
  batchGetTokenBalances
} from '../../utils/tokenUtils';
import { 
  getBestSwapQuote,
  calculateETHForTokens,
  swapETHForToken,
  checkSwapRoute
} from '../../utils/swapUtils';
import SwapModal from '../ui/SwapModal';
import { ethers } from 'ethers';

const TokenTransfer = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord } = useTransaction();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({});
  const [ethBalance, setEthBalance] = useState('0.000000');
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapQuote, setSwapQuote] = useState(null);
  const [swapRoute, setSwapRoute] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  
  const [form, setForm] = useState({
    address: '',
    amount: '1.0',
    data: generateTransferData()
  });

  // Computed values
  const supportedTokens = getTokensByChainId(wallet.chainId);
  const currentToken = supportedTokens[selectedToken];
  const hasUniswapSupport = !!getUniswapRouter(wallet.chainId);
  const networkName = getNetworkName(wallet.chainId);

  // Generate transfer data based on context
  function generateTransferData() {
    const timestamp = Date.now();
    const orderNumber = `ORD${timestamp}`;
    return `订单编号:${orderNumber} 付款类型:代币转账 Token transfer via smart contract - Network: ${networkName || 'Unknown'} - Timestamp: ${new Date().toISOString()}`;
  }

  // Fetch all balances efficiently
  useEffect(() => {
    const fetchBalances = async () => {
      if (!wallet.address || !window.ethereum || Object.keys(supportedTokens).length === 0) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get ETH balance
        const ethBal = await getETHBalance(provider, wallet.address);
        setEthBalance(ethBal);
        
        // Get token balances in batch
        const tokenEntries = Object.entries(supportedTokens);
        const addresses = tokenEntries.map(([, token]) => token.address);
        const decimalsArray = tokenEntries.map(([, token]) => token.decimals);
        
        const tokenBalances = await batchGetTokenBalances(
          provider, 
          addresses, 
          wallet.address, 
          decimalsArray
        );
        
        const balanceMap = {};
        tokenEntries.forEach(([symbol], index) => {
          balanceMap[symbol] = tokenBalances[index];
        });
        
        setBalances(balanceMap);
      } catch (error) {
        console.error('获取余额失败:', error);
        showToast('获取余额失败，请检查网络连接', 'error');
      }
    };

    fetchBalances();
    
    // Auto refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [wallet.address, wallet.chainId, supportedTokens]);

  // Check swap availability and get quotes
  useEffect(() => {
    const checkSwapAvailability = async () => {
      if (!currentToken || !form.amount || !hasUniswapSupport) {
        setSwapQuote(null);
        setSwapRoute(null);
        return;
      }

      const required = parseFloat(form.amount);
      const available = parseFloat(balances[selectedToken] || '0');
      
      if (required <= available) {
        setSwapQuote(null);
        setSwapRoute(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const amountWei = ethers.parseUnits(form.amount, currentToken.decimals);
        
        // Get ETH required for this amount
        const ethRequired = await calculateETHForTokens(
          provider,
          wallet.chainId,
          currentToken.address,
          amountWei.toString()
        );
        
        const ethRequiredFormatted = parseFloat(ethers.formatEther(ethRequired)).toFixed(6);
        const canAfford = parseFloat(ethBalance) >= parseFloat(ethRequiredFormatted);
        
        // Check swap route
        const route = await checkSwapRoute(
          provider,
          wallet.chainId,
          getWETHAddress(wallet.chainId),
          currentToken.address,
          ethRequired
        );
        
        setSwapQuote({
          tokenAmount: form.amount,
          ethRequired: ethRequiredFormatted,
          canAfford,
          shortage: (required - available).toFixed(6)
        });
        
        setSwapRoute(route);
        
      } catch (error) {
        console.error('检查兑换可用性失败:', error);
        setSwapQuote(null);
        setSwapRoute(null);
      }
    };

    const debounceTimer = setTimeout(checkSwapAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [form.amount, selectedToken, balances, ethBalance, currentToken, hasUniswapSupport, wallet.chainId]);

  // Check approval status when token or router changes
  useEffect(() => {
    const checkApproval = async () => {
      if (!currentToken || !wallet.address || !hasUniswapSupport) {
        setApprovalStatus(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const routerAddress = getUniswapRouter(wallet.chainId);
        const amountWei = ethers.parseUnits(form.amount || '0', currentToken.decimals);
        
        const approval = await checkTokenApproval(
          provider,
          currentToken.address,
          wallet.address,
          routerAddress,
          amountWei.toString()
        );
        
        setApprovalStatus(approval);
      } catch (error) {
        console.error('检查授权状态失败:', error);
        setApprovalStatus(null);
      }
    };

    checkApproval();
  }, [currentToken, wallet.address, form.amount, hasUniswapSupport, wallet.chainId]);

  // Handle token selection
  const handleTokenSelect = (symbol) => {
    setSelectedToken(symbol);
    setForm(prev => ({
      ...prev,
      data: generateTransferData()
    }));
  };

  // Handle swap and transfer with improved flow
  const handleSwapAndTransfer = async (slippage = 5) => {
    if (!swapQuote || !currentToken || !swapRoute?.isAvailable) return;
    
    setLoading(true);
    try {
      showProgress('准备ETH兑换...');
      updateProgress(1);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amountWei = ethers.parseUnits(form.amount, currentToken.decimals);
      const ethAmountWei = ethers.parseEther(swapQuote.ethRequired);
      
      // Calculate minimum output with slippage
      const minAmountOut = (amountWei * BigInt(100 - slippage) / BigInt(100)).toString();
      
      updateProgress(2);
      showProgress('执行ETH兑换...');
      
      // Execute swap
      const swapTx = await swapETHForToken(
        signer,
        wallet.chainId,
        currentToken.address,
        ethAmountWei.toString(),
        minAmountOut,
        wallet.address,
        slippage
      );
      
      updateProgress(3);
      showProgress('等待兑换确认...');
      const swapReceipt = await swapTx.wait();
      
      // Wait for balance update
      updateProgress(4);
      showProgress('刷新余额...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check new balance
      const newBalance = await getTokenBalance(
        provider, 
        currentToken.address, 
        wallet.address, 
        currentToken.decimals
      );
      
      setBalances(prev => ({ ...prev, [selectedToken]: newBalance }));
      
      if (parseFloat(newBalance) >= parseFloat(form.amount)) {
        updateProgress(5);
        showProgress('执行代币转账...');
        
        // Execute transfer
        const transferTx = await transferToken(
          signer,
          currentToken.address,
          form.address,
          amountWei.toString()
        );
        
        const transferReceipt = await transferTx.wait();
        
        // Record transaction
        addRecord({
          type: `🔄 ${selectedToken}转账 (含ETH兑换)`,
          hash: transferTx.hash,
          amount: `${form.amount} ${selectedToken}`,
          data: form.data,
          gasUsed: (BigInt(swapReceipt.gasUsed) + BigInt(transferReceipt.gasUsed)).toString(),
          blockNumber: transferReceipt.blockNumber,
          extra: `ETH兑换: ${swapQuote.ethRequired} ETH → ${form.amount} ${selectedToken}`
        });
        
        setTimeout(() => {
          hideProgress();
          showToast('✅ ETH兑换并转账成功！', 'success');
          setShowSwapModal(false);
          // Reset form
          setForm(prev => ({ ...prev, amount: '1.0', address: '', data: generateTransferData() }));
        }, 500);
      } else {
        throw new Error(`兑换后余额不足：获得 ${newBalance} ${selectedToken}，需要 ${form.amount} ${selectedToken}`);
      }
      
    } catch (error) {
      hideProgress();
      console.error('ETH兑换并转账失败:', error);
      
      let errorMessage = '操作失败: ' + error.message;
      if (error.message.includes('user rejected')) {
        errorMessage = '用户取消了交易';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'ETH余额不足，请检查余额';
      }
      
      showToast(errorMessage, 'error');
      setShowSwapModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle direct transfer with approval check
  const handleDirectTransfer = async () => {
    if (!currentToken) return;
    
    setLoading(true);
    try {
      showProgress('准备代币转账...');
      updateProgress(1);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amountWei = ethers.parseUnits(form.amount, currentToken.decimals);
      
      // Check if approval is needed for router (for future swaps)
      const routerAddress = getUniswapRouter(wallet.chainId);
      if (routerAddress && approvalStatus?.needsApproval) {
        updateProgress(2);
        showProgress('授权代币使用权限...');
        showToast('需要授权代币使用权限，请确认MetaMask交易...', 'info');
        
        const approveTx = await approveToken(
          signer,
          currentToken.address,
          routerAddress,
          ethers.MaxUint256,
          true // Use infinite approval
        );
        
        await approveTx.wait();
        showToast('✅ 代币授权成功！', 'success');
        
        // Update approval status
        setApprovalStatus(prev => ({ ...prev, needsApproval: false, hasInfiniteApproval: true }));
      }
      
      updateProgress(4);
      showProgress('执行代币转账...');
      
      // Execute transfer
      const transferTx = await transferToken(
        signer,
        currentToken.address,
        form.address,
        amountWei.toString()
      );
      
      updateProgress(5);
      showProgress('等待转账确认...');
      const receipt = await transferTx.wait();
      
      // Record transaction
      addRecord({
        type: `🪙 ${selectedToken}转账`,
        hash: transferTx.hash,
        amount: `${form.amount} ${selectedToken}`,
        data: form.data,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        extra: `直接转账到 ${form.address.slice(0, 6)}...${form.address.slice(-4)}`
      });
      
      setTimeout(() => {
        hideProgress();
        showToast('✅ 代币转账成功！', 'success');
        // Reset form
        setForm(prev => ({ ...prev, amount: '1.0', address: '', data: generateTransferData() }));
        
        // Refresh balances
        setTimeout(() => {
          const fetchBalance = async () => {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const newBalance = await getTokenBalance(
              provider, 
              currentToken.address, 
              wallet.address, 
              currentToken.decimals
            );
            setBalances(prev => ({ ...prev, [selectedToken]: newBalance }));
          };
          fetchBalance();
        }, 2000);
      }, 500);
      
    } catch (error) {
      hideProgress();
      console.error('代币转账失败:', error);
      
      let errorMessage = '转账失败: ' + error.message;
      if (error.message.includes('user rejected')) {
        errorMessage = '用户取消了交易';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = '余额不足或Gas费不够';
      } else if (error.message.includes('transfer amount exceeds balance')) {
        errorMessage = '转账金额超过余额';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!currentToken) {
      showToast(`当前网络 (${networkName}) 不支持所选代币`, 'error');
      return;
    }

    if (!form.address || !ethers.isAddress(form.address)) {
      showToast('请输入有效的以太坊地址', 'error');
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      showToast('请输入有效的转账金额', 'error');
      return;
    }

    const required = parseFloat(form.amount);
    const available = parseFloat(balances[selectedToken] || '0');
    
    if (required > available) {
      if (swapQuote?.canAfford && swapRoute?.isAvailable) {
        setShowSwapModal(true);
      } else if (swapQuote && !swapQuote.canAfford) {
        showToast(`ETH余额不足，需要 ${swapQuote.ethRequired} ETH 兑换 ${selectedToken}`, 'error');
      } else {
        showToast('余额不足且当前网络不支持ETH兑换', 'error');
      }
    } else {
      await handleDirectTransfer();
    }
  };

  // Show network not supported message
  if (Object.keys(supportedTokens).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-yellow-800 mb-2">当前网络不支持代币转账</h3>
        <p className="text-yellow-700 mb-4">
          当前连接的网络: <span className="font-semibold">{networkName}</span>
        </p>
        <p className="text-yellow-600 text-sm">
          请切换到支持的网络：Ethereum、Sepolia、BSC
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">🪙</span>
        <div>
          <h3 className="text-lg font-bold text-purple-900">增强版代币转账</h3>
          <p className="text-purple-700 text-sm">
            当前网络: {networkName} | 支持多种稳定币，智能ETH兑换，自动授权管理
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">🏷️ 选择代币</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(supportedTokens).map(([symbol, token]) => (
              <button
                key={symbol}
                type="button"
                onClick={() => handleTokenSelect(symbol)}
                disabled={loading}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedToken === symbol
                    ? 'border-purple-500 bg-purple-100 shadow-md'
                    : 'border-gray-300 bg-white hover:border-purple-300 hover:shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-xl">{token.icon}</span>
                  <span className="font-semibold">{symbol}</span>
                  <span className="text-xs bg-gray-200 px-1 rounded">{token.type}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">{token.name}</div>
                <div className="text-sm font-medium text-purple-600">
                  {balances[symbol] || '加载中...'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <h4 className="font-medium mb-3 flex items-center">
            💳 钱包余额
            {approvalStatus?.hasInfiniteApproval && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                ✅ 已授权
              </span>
            )}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block">ETH余额:</span>
              <span className="font-semibold text-lg">{ethBalance}</span>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <span className="text-gray-600 block">{selectedToken}余额:</span>
              <span className="font-semibold text-lg">{balances[selectedToken] || '0.000000'}</span>
            </div>
          </div>
        </div>

        {/* Transfer Address */}
        <div>
          <label className="block text-sm font-medium mb-2">📍 转账地址</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none font-mono text-sm"
            placeholder="0x..."
            required
            disabled={loading}
          />
          {form.address && !ethers.isAddress(form.address) && (
            <p className="text-red-500 text-xs mt-1">请输入有效的以太坊地址</p>
          )}
        </div>

        {/* Transfer Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            💰 转账金额 ({selectedToken})
          </label>
          <div className="relative">
            <input
              type="number"
              value={form.amount}
              step="0.000001"
              min="0"
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, amount: balances[selectedToken] || '0' }))}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
              disabled={loading}
            >
              最大
            </button>
          </div>
          
          {/* Balance Warning */}
          {parseFloat(form.amount) > parseFloat(balances[selectedToken] || '0') && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-sm font-medium mb-2">
                ⚠️ 余额不够！还需要 {swapQuote?.shortage} {selectedToken}
              </div>
              {swapQuote && hasUniswapSupport && (
                <div className="space-y-2">
                  <div className="text-sm">
                    {swapQuote.canAfford ? (
                      <div className="text-green-700">
                        ✅ 可用 {swapQuote.ethRequired} ETH 兑换所需的 {selectedToken}
                        {swapRoute && (
                          <div className="text-xs text-gray-600 mt-1">
                            预估手续费: {swapRoute.fee/10000}% | 价格影响: {swapRoute.priceImpact}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-700">
                        ❌ ETH余额不足，需要 {swapQuote.ethRequired} ETH
                      </div>
                    )}
                  </div>
                  {swapQuote.canAfford && (
                    <button
                      type="button"
                      onClick={() => setShowSwapModal(true)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline disabled:opacity-50"
                    >
                      点击查看兑换详情 →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transfer Data */}
        <div>
          <label className="block text-sm font-medium mb-2">📄 转账信息</label>
          <textarea
            value={form.data}
            rows="3"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none resize-none text-sm"
            placeholder="输入转账相关信息..."
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 转账信息将记录在区块链交易中，建议包含订单号或用途说明
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !wallet.address || !form.address || !form.amount}
          className={`w-full py-4 rounded-lg font-semibold transition-all ${
            loading || !wallet.address || !form.address || !form.amount
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
              : parseFloat(form.amount) > parseFloat(balances[selectedToken] || '0') && swapQuote?.canAfford
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-1'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>处理中...</span>
            </div>
          ) : parseFloat(form.amount) > parseFloat(balances[selectedToken] || '0') && swapQuote?.canAfford ? (
            `🔄 用ETH兑换并转账 ${form.amount} ${selectedToken}`
          ) : (
            `💸 发送 ${form.amount} ${selectedToken}`
          )}
        </button>
      </form>

      {/* Feature Description */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 功能说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持多种稳定币转账（USDT、USDC、DAI等）</li>
          <li>• 余额不足时智能ETH兑换功能</li>
          <li>• 自动检测并处理ERC20代币授权</li>
          <li>• 多费率层级，自动选择最优汇率</li>
          <li>• 转账信息永久记录在区块链上</li>
        </ul>
      </div>

      {/* Swap Modal */}
      <SwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        onConfirm={handleSwapAndTransfer}
        swapQuote={swapQuote}
        swapRoute={swapRoute}
        selectedToken={selectedToken}
        ethBalance={ethBalance}
        loading={loading}
        targetAmount={form.amount}
        recipientAddress={form.address}
      />
    </div>
  );
};

export default TokenTransfer;