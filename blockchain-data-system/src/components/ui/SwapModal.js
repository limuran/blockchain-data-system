import React, { useState } from 'react';
import { ethers } from 'ethers';

const SwapModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  swapQuote, 
  selectedToken, 
  ethBalance,
  loading 
}) => {
  const [slippage, setSlippage] = useState(5); // 5% 默认滑点

  if (!isOpen || !swapQuote) return null;

  const handleConfirm = () => {
    onConfirm(slippage);
  };

  const slippageOptions = [1, 3, 5, 10];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">🔄 ETH兑换{selectedToken}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* 兑换详情 */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">支付</span>
              <span className="text-sm text-gray-500">余额: {ethBalance} ETH</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm">⚡</span>
              </div>
              <div>
                <div className="font-semibold text-lg">{swapQuote.ethRequired} ETH</div>
                <div className="text-sm text-gray-500">以太坊</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">↓</span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">接收</span>
              <span className="text-sm text-green-600">估算值</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm">🔗</span>
              </div>
              <div>
                <div className="font-semibold text-lg">{swapQuote.tokenAmount} {selectedToken}</div>
                <div className="text-sm text-gray-500">
                  {selectedToken === 'USDT' ? 'Tether USD' : 
                   selectedToken === 'USDC' ? 'USD Coin' : 
                   selectedToken === 'DAI' ? 'Dai Stablecoin' : selectedToken}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 滑点设置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            滑点容忍度
          </label>
          <div className="grid grid-cols-4 gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSlippage(option)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  slippage === option
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}%
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            滑点越高，交易成功率越高，但可能获得的代币更少
          </p>
        </div>

        {/* 交易信息 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">📋 交易信息</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>汇率</span>
              <span>1 ETH ≈ {(parseFloat(swapQuote.tokenAmount) / parseFloat(swapQuote.ethRequired)).toFixed(2)} {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>最小接收</span>
              <span>{(parseFloat(swapQuote.tokenAmount) * (100 - slippage) / 100).toFixed(6)} {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>网络费用</span>
              <span>~0.001-0.003 ETH</span>
            </div>
          </div>
        </div>

        {/* 余额检查 */}
        {!swapQuote.canAfford && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">❌</span>
              <span className="text-red-700 text-sm font-medium">
                ETH余额不足，需要 {swapQuote.ethRequired} ETH
              </span>
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !swapQuote.canAfford}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              loading || !swapQuote.canAfford
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>处理中...</span>
              </div>
            ) : (
              `确认兑换`
            )}
          </button>
        </div>

        {/* 风险提示 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>风险提示：</strong> DeFi交易存在滑点和MEV风险，请确认交易详情后再执行。
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwapModal;