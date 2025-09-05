import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTransaction } from '../../contexts/TransactionContext';
import { getTokensByChainId, getUniswapRouter } from '../../config/tokens';
import { 
  getTokenBalance, 
  getETHBalance, 
  checkTokenApproval, 
  approveToken, 
  transferToken 
} from '../../utils/tokenUtils';
import { 
  getSwapQuote, 
  swapETHForToken, 
  calculateETHForTokens 
} from '../../utils/swapUtils';
import { ethers } from 'ethers';

const TokenTransfer = ({ showToast, showProgress, updateProgress, hideProgress }) => {
  const { wallet } = useWallet();
  const { addRecord } = useTransaction();
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({});
  const [ethBalance, setEthBalance] = useState('0.000000');
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [showSwapOption, setShowSwapOption] = useState(false);
  const [swapQuote, setSwapQuote] = useState(null);
  const [form, setForm] = useState({
    address: '',
    amount: '1.0',
    data: '订单编号:ORD' + Date.now() + ' 付款类型:服务费 Service payment for order'
  });

  const supportedTokens = getTokensByChainId(wallet.chainId);
  const currentToken = supportedTokens[selectedToken];
  const hasUniswapSupport = !!getUniswapRouter(wallet.chainId);

  // 获取所有余额
  useEffect(() => {
    const fetchBalances = async () => {
      if (wallet.address && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // 获取ETH余额
          const ethBal = await getETHBalance(provider, wallet.address);
          setEthBalance(ethBal);
          
          // 获取代币余额
          const tokenBalances = {};
          for (const [symbol, token] of Object.entries(supportedTokens)) {
            const balance = await getTokenBalance(
              provider, 
              token.address, 
              wallet.address, 
              token.decimals
            );
            tokenBalances[symbol] = balance;
          }
          setBalances(tokenBalances);
        } catch (error) {
          console.error('获取余额失败:', error);
        }
      }
    };

    fetchBalances();
  }, [wallet.address, wallet.chainId, supportedTokens]);

  // 检查余额并显示兑换选项
  useEffect(() => {
    const checkBalance = async () => {
      if (currentToken && form.amount && balances[selectedToken]) {
        const required = parseFloat(form.amount);
        const available = parseFloat(balances[selectedToken]);
        
        if (required > available && hasUniswapSupport) {
          setShowSwapOption(true);
          
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const amountWei = ethers.parseUnits(form.amount, currentToken.decimals);
            const ethRequired = await calculateETHForTokens(
              provider,
              wallet.chainId,
              currentToken.address,
              amountWei.toString()
            );
            
            setSwapQuote({
              tokenAmount: form.amount,
              ethRequired: parseFloat(ethers.formatEther(ethRequired)).toFixed(6),
              canAfford: parseFloat(ethBalance) >= parseFloat(ethers.formatEther(ethRequired))
            });
          } catch (error) {
            console.error('获取兑换报价失败:', error);
            setSwapQuote(null);
          }
        } else {
          setShowSwapOption(false);
          setSwapQuote(null);
        }
      }
    };

    checkBalance();
  }, [form.amount, selectedToken, balances, ethBalance, currentToken, hasUniswapSupport, wallet.chainId]);

  const handleSwapAndTransfer = async () => {
    if (!swapQuote || !currentToken) return;
    
    setLoading(true);
    try {
      showProgress('执行ETH兑换并转账...');
      updateProgress(1);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amountWei = ethers.parseUnits(form.amount, currentToken.decimals);
      const ethAmountWei = ethers.parseEther(swapQuote.ethRequired);
      
      updateProgress(2);
      
      // 执行兑换
      const swapTx = await swapETHForToken(
        signer,
        wallet.chainId,
        currentToken.address,
        ethAmountWei.toString(),
        (amountWei * BigInt(95) / BigInt(100)).toString(), // 5%滑点
        wallet.address
      );
      
      updateProgress(3);
      await swapTx.wait();
      
      // 执行转账
      updateProgress(4);
      const transferTx = await transferToken(
        signer,
        currentToken.address,
        form.address,
        amountWei.toString()
      );
      
      updateProgress(5);
      const receipt = await transferTx.wait();
      
      addRecord({
        type: `🔄 ${selectedToken}转账 (含ETH兑换)`,
        hash: transferTx.hash,
        amount: `${form.amount} ${selectedToken}`,
        data: form.data,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        extra: `ETH兑换: ${swapQuote.ethRequired} ETH`
      });
      
      setTimeout(() => {
        hideProgress();
        showToast('✅ ETH兑换并转账成功！', 'success');
      }, 500);
      
    } catch (error) {
      hideProgress();
      showToast('操作失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectTransfer = async () => {
    if (!currentToken) return;
    
    setLoading(true);
    try {
      showProgress('执行代币转账...');
      updateProgress(1);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amountWei = ethers.parseUnits(form.amount, currentToken.decimals);
      
      // 检查是否需要授权
      const routerAddress = getUniswapRouter(wallet.chainId);
      if (routerAddress && currentToken.type === 'ERC20') {
        updateProgress(2);
        const approval = await checkTokenApproval(
          provider,
          currentToken.address,
          wallet.address,
          routerAddress,
          amountWei.toString()
        );
        
        if (approval.needsApproval) {
          showToast('需要授权代币使用权限...', 'info');
          updateProgress(3);
          const approveTx = await approveToken(
            signer,
            currentToken.address,
            routerAddress,
            ethers.MaxUint256
          );
          await approveTx.wait();
          showToast('✅ 授权成功！', 'success');
        }
      }
      
      updateProgress(4);
      const transferTx = await transferToken(
        signer,
        currentToken.address,
        form.address,
        amountWei.toString()
      );
      
      updateProgress(5);
      const receipt = await transferTx.wait();
      
      addRecord({
        type: `🪙 ${selectedToken}转账`,
        hash: transferTx.hash,
        amount: `${form.amount} ${selectedToken}`,
        data: form.data,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      });
      
      setTimeout(() => {
        hideProgress();
        showToast('✅ 代币转账成功！', 'success');
      }, 500);
      
    } catch (error) {
      hideProgress();
      showToast('转账失败: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.address) {
      showToast('请先连接钱包', 'error');
      return;
    }

    if (!currentToken) {
      showToast('当前网络不支持所选代币', 'error');
      return;
    }

    const required = parseFloat(form.amount);
    const available = parseFloat(balances[selectedToken] || '0');
    
    if (required > available) {
      if (showSwapOption && swapQuote?.canAfford) {
        await handleSwapAndTransfer();
      } else {
        showToast('余额不足且无法通过ETH兑换', 'error');
      }
    } else {
      await handleDirectTransfer();
    }
  };

  if (Object.keys(supportedTokens).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-yellow-800 mb-2">当前网络不支持代币转账</h3>
        <p className="text-yellow-700">请切换到支持的网络</p>
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
            支持多种稳定币，自动ETH兑换，智能合约授权
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 代币选择 */}
        <div>
          <label className="block text-sm font-medium mb-3">🏷️ 选择代币</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(supportedTokens).map(([symbol, token]) => (
              <button
                key={symbol}
                type="button"
                onClick={() => setSelectedToken(symbol)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedToken === symbol
                    ? 'border-purple-500 bg-purple-100'
                    : 'border-gray-300 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{token.icon}</span>
                  <span className="font-semibold">{symbol}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{token.name}</div>
                <div className="text-sm font-medium text-purple-600 mt-1">
                  {balances[symbol] || '0.000000'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 钱包余额 */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-medium mb-2">💳 钱包余额</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ETH: </span>
              <span className="font-semibold">{ethBalance}</span>
            </div>
            <div>
              <span className="text-gray-600">{selectedToken}: </span>
              <span className="font-semibold">{balances[selectedToken] || '0.000000'}</span>
            </div>
          </div>
        </div>

        {/* 转账地址 */}
        <div>
          <label className="block text-sm font-medium mb-2">📍 转账地址</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none font-mono text-sm"
            placeholder="0x..."
            required
          />
        </div>

        {/* 转账金额 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            💰 转账金额 ({selectedToken})
          </label>
          <input
            type="number"
            value={form.amount}
            step="0.000001"
            min="0"
            onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
            required
          />
          
          {/* 余额不足警告 */}
          {parseFloat(form.amount) > parseFloat(balances[selectedToken] || '0') && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 text-sm font-medium">
                ⚠️ 余额不够！
              </div>
              {showSwapOption && swapQuote && (
                <div className="mt-2 text-sm">
                  {swapQuote.canAfford ? (
                    <div className="text-green-700">
                      ✅ 可以用 {swapQuote.ethRequired} ETH 兑换 {form.amount} {selectedToken}
                    </div>
                  ) : (
                    <div className="text-red-700">
                      ❌ ETH余额不足，需要 {swapQuote.ethRequired} ETH
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 转账信息 */}
        <div>
          <label className="block text-sm font-medium mb-2">📄 转账信息</label>
          <textarea
            value={form.data}
            rows="3"
            onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none resize-none text-sm"
            placeholder="输入转账相关信息..."
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 由于这是合约转账，转账信息将记录在区块链上
          </p>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading || !wallet.address}
          className={`w-full py-4 rounded-lg font-semibold transition-all ${
            loading || !wallet.address
              ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
              : showSwapOption && swapQuote?.canAfford
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-1'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:-translate-y-1'
          }`}
        >
          {loading ? (
            '处理中...'
          ) : showSwapOption && swapQuote?.canAfford ? (
            `🔄 用ETH兑换并转账 ${form.amount} ${selectedToken}`
          ) : (
            `💸 发送 ${form.amount} ${selectedToken}`
          )}
        </button>
      </form>

      {/* 功能说明 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 功能说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 支持多种稳定币转账（USDT、USDC、DAI等）</li>
          <li>• 余额不足时自动提示ETH兑换选项</li>
          <li>• 智能检测并处理ERC20代币授权</li>
          <li>• 转账信息将永久记录在区块链上</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenTransfer;