import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const SwapModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  swapQuote, 
  swapRoute,
  selectedToken, 
  ethBalance,
  loading,
  targetAmount,
  recipientAddress
}) => {
  const [slippage, setSlippage] = useState(5);
  const [step, setStep] = useState(1);
  const [estimatedGas, setEstimatedGas] = useState('0.002');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (swapRoute?.gasEstimate) {
      try {
        const gasInEth = parseFloat(ethers.formatEther(BigInt(swapRoute.gasEstimate) * BigInt(20000000000)));
        setEstimatedGas(gasInEth.toFixed(6));
      } catch (error) {
        setEstimatedGas('0.002');
      }
    }
  }, [swapRoute]);

  if (!isOpen || !swapQuote) return null;

  const handleConfirm = () => {
    setStep(2);
    onConfirm(slippage);
  };

  const slippageOptions = [1, 3, 5, 10];
  const minReceived = swapQuote.tokenAmount ? 
    (parseFloat(swapQuote.tokenAmount) * (100 - slippage) / 100).toFixed(6) : '0';
  const totalEthCost = parseFloat(swapQuote.ethRequired) + parseFloat(estimatedGas);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          // Step 1: Confirm Swap
          <>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">🔄 ETH兑换{selectedToken}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                  disabled={loading}
                >
                  ×
                </button>
              </div>

              {/* Swap Preview */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">支付</span>
                    <span className="text-xs text-gray-500">余额: {ethBalance} ETH</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">⚡</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{swapQuote.ethRequired} ETH</div>
                      <div className="text-sm text-gray-500">以太坊</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-lg">↓</span>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">接收 (估算)</span>
                    <span className="text-xs text-green-600">目标金额</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🪙</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{targetAmount} {selectedToken}</div>
                      <div className="text-sm text-gray-500">
                        最少收到: {minReceived} {selectedToken}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slippage Settings */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  滑点容忍度
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
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
                <p className="text-xs text-gray-500">
                  滑点越高，交易成功率越高，但可能获得的代币更少
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">📋 交易详情</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800">汇率</span>
                    <span className="font-medium">
                      1 ETH ≈ {(parseFloat(targetAmount) / parseFloat(swapQuote.ethRequired)).toFixed(2)} {selectedToken}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">手续费层级</span>
                    <span className="font-medium">{swapRoute?.fee ? (swapRoute.fee/10000).toFixed(2) : '0.30'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">价格影响</span>
                    <span className="font-medium">{swapRoute?.priceImpact || '< 0.01'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-800">预估Gas费</span>
                    <span className="font-medium">{estimatedGas} ETH</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-blue-900">总计消耗</span>
                      <span className="text-blue-900">{totalEthCost.toFixed(6)} ETH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Info */}
              {recipientAddress && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6 border">
                  <div className="text-sm text-gray-600 mb-1">转账目标地址:</div>
                  <div className="font-mono text-sm break-all">
                    {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                  </div>
                </div>
              )}

              {/* Balance Check */}
              {!swapQuote.canAfford && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">❌</span>
                    <span className="text-red-700 text-sm font-medium">
                      ETH余额不足，需要 {totalEthCost.toFixed(6)} ETH（含Gas费）
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t p-6">
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
                  确认兑换并转账
                </button>
              </div>
            </div>

            {/* Risk Warning */}
            <div className="px-6 pb-6">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>风险提示：</strong> DeFi交易存在滑点和MEV风险，兑换后将自动执行代币转账。
                </p>
              </div>
            </div>
          </>
        ) : (
          // Step 2: Progress Display
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">处理中...</h3>
              <p className="text-gray-600 text-sm">
                正在执行ETH兑换并转账，请在MetaMask中确认交易
              </p>
            </div>

            <div className="space-y-3 text-sm text-left bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>1. 准备兑换交易</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>2. 执行ETH兑换</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>3. 等待兑换确认</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>4. 执行代币转账</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>5. 完成</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              请勿关闭此窗口，交易可能需要几分钟完成
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapModal;