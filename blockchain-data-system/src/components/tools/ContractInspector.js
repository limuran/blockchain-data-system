import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ExternalLink, Search, Copy } from 'lucide-react';

const ContractInspector = ({ showToast }) => {
  const [contractAddress, setContractAddress] = useState('');
  const [contractInfo, setContractInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const inspectContract = async () => {
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      showToast('请输入有效的合约地址', 'error');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 检查是否是合约
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        setContractInfo({
          isContract: false,
          error: '该地址不是智能合约'
        });
        return;
      }

      // 查找合约创建交易
      const latestBlock = await provider.getBlockNumber();
      let creationBlock = null;
      let creationTx = null;
      
      // 从最新区块向前查找（最多查找1000个区块）
      for (let i = latestBlock; i > Math.max(0, latestBlock - 1000); i--) {
        try {
          const block = await provider.getBlock(i, true);
          if (block?.transactions) {
            for (const tx of block.transactions) {
              // 查找创建该合约的交易
              if (tx.to === null) { // 合约创建交易的to字段为null
                const receipt = await provider.getTransactionReceipt(tx.hash);
                if (receipt?.contractAddress?.toLowerCase() === contractAddress.toLowerCase()) {
                  creationBlock = i;
                  creationTx = tx;
                  break;
                }
              }
            }
          }
          if (creationBlock) break;
        } catch (e) {
          continue; // 跳过无法读取的区块
        }
      }

      // 获取当前状态
      const balance = await provider.getBalance(contractAddress);
      
      setContractInfo({
        isContract: true,
        address: contractAddress,
        balance: ethers.formatEther(balance),
        creationBlock,
        creationTx: creationTx?.hash,
        deployer: creationTx?.from,
        codeSize: (code.length - 2) / 2, // 字节数
        network: 'Sepolia' // 可以动态获取
      });

      if (creationBlock) {
        showToast(`✅ 找到创建区块: ${creationBlock}`, 'success');
      } else {
        showToast('⚠️ 未找到创建区块，可能在1000个区块之前', 'warning');
      }
    } catch (error) {
      setContractInfo({
        isContract: false,
        error: '检查失败: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板', 'success');
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
        <Search className="mr-2" size={20} />
        合约信息检查器
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">🏢 合约地址</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="0x... (粘贴你的DataStorage合约地址)"
            />
            <button
              onClick={inspectContract}
              disabled={loading}
              className={`bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all ${
                loading ? 'opacity-50' : 'hover:bg-blue-600'
              }`}
            >
              {loading ? '检查中...' : '🔍 检查'}
            </button>
          </div>
        </div>

        {contractInfo && (
          <div className={`p-4 rounded-lg border ${
            contractInfo.isContract ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            {contractInfo.isContract ? (
              <div className="space-y-3">
                <div className="flex items-center text-green-700">
                  <span className="text-lg mr-2">✅</span>
                  <span className="font-semibold">有效的智能合约</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">💰 合约余额:</span>
                    <span className="ml-2">{contractInfo.balance} ETH</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">📏 代码大小:</span>
                    <span className="ml-2">{contractInfo.codeSize} 字节</span>
                  </div>
                  {contractInfo.creationBlock && (
                    <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="font-medium text-yellow-800 mb-2">🎯 子图配置信息</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span>📍 起始区块号 (startBlock):</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-700 font-mono">
                              {contractInfo.creationBlock}
                            </code>
                            <button
                              onClick={() => copyToClipboard(contractInfo.creationBlock.toString())}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="复制区块号"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🏗️ 创建交易:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-700 font-mono text-xs">
                              {contractInfo.creationTx ? 
                                `${contractInfo.creationTx.slice(0, 10)}...${contractInfo.creationTx.slice(-6)}` : 
                                '未找到'
                              }
                            </code>
                            {contractInfo.creationTx && (
                              <a 
                                href={`https://sepolia.etherscan.io/tx/${contractInfo.creationTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-yellow-600 hover:text-yellow-800"
                                title="在etherscan查看创建交易"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>👤 部署者:</span>
                          <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-700 font-mono text-xs">
                            {contractInfo.deployer ? 
                              `${contractInfo.deployer.slice(0, 6)}...${contractInfo.deployer.slice(-4)}` :
                              '未找到'
                            }
                          </code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <h4 className="font-medium text-blue-800 mb-1">📋 使用步骤:</h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. 复制上面的区块号到你的子图 subgraph.yaml</li>
                    <li>2. 将这个合约地址也更新到子图配置</li>
                    <li>3. 运行 npm run deploy 重新部署子图</li>
                    <li>4. 回到前端测试数据存储和查询功能</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-red-700">
                <span className="text-lg mr-2">❌</span>
                {contractInfo.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractInspector;