// 💰 ETH转账组件 - 方式1：使用Ethers.js读取链上数据
function EthTransfer({ onTransaction }) {
    const [form, setForm] = useState({
        address: '0x742d35Cc6634C0532925a3b8D6E14a87B8F0E652',
        amount: '0.001',
        data: '{"user": "alice", "action": "register", "timestamp": ' + Date.now() + '}'
    });
    const [loading, setLoading] = useState(false);
    const [gasEstimate, setGasEstimate] = useState(null);
    
    // 实时Gas估算
    useEffect(() => {
        const estimateGas = async () => {
            if (form.address && form.amount && form.data && window.ethereum) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const amountWei = ethers.parseEther(form.amount);
                    const encodedData = ethers.hexlify(ethers.toUtf8Bytes(form.data));
                    
                    const gasEstimate = await provider.estimateGas({
                        to: form.address,
                        value: amountWei,
                        data: encodedData
                    });
                    
                    setGasEstimate(gasEstimate.toString());
                } catch (e) {
                    setGasEstimate('21000'); // 默认值
                }
            }
        };
        
        const debounce = setTimeout(estimateGas, 500);
        return () => clearTimeout(debounce);
    }, [form.address, form.amount, form.data]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 验证以太坊地址
        if (!ethers.isAddress(form.address)) {
            alert('❌ 请输入有效的以太坊地址');
            return;
        }
        
        // 验证金额
        if (parseFloat(form.amount) <= 0) {
            alert('❌ 请输入有效的转账金额');
            return;
        }
        
        // 验证JSON格式
        try {
            JSON.parse(form.data);
        } catch {
            alert('❌ 请输入有效的JSON格式数据');
            return;
        }
        
        setLoading(true);
        try {
            await onTransaction('eth', form);
            // 清空数据字段，保留地址和金额便于下次使用
            setForm(prev => ({ 
                ...prev, 
                data: '{"user": "alice", "action": "register", "timestamp": ' + Date.now() + '}' 
            }));
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">💰</span>
                <div>
                    <h3 className="text-lg font-bold text-blue-900">ETH 转账数据上链</h3>
                    <p className="text-blue-700 text-sm">
                        <strong>方式1:</strong> 使用Ethers.js在转账交易的data字段中嵌入自定义数据
                    </p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        📍 接收地址
                    </label>
                    <input 
                        type="text" 
                        value={form.address} 
                        onChange={(e) => setForm(prev => ({...prev, address: e.target.value}))}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono text-sm transition-all"
                        placeholder="0x..."
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        🔍 支持ENS域名（如 alice.eth）
                    </p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        💎 转账金额 (ETH)
                    </label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={form.amount} 
                            step="0.0001"
                            min="0"
                            onChange={(e) => setForm(prev => ({...prev, amount: e.target.value}))}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="0.001"
                            required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-gray-500 text-sm font-medium">ETH</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        💡 使用 <code className="bg-gray-100 px-1 rounded">BigNumber.js</code> 处理18位小数精度
                    </p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        📄 上链数据 (JSON格式)
                    </label>
                    <textarea 
                        value={form.data} 
                        rows="4"
                        onChange={(e) => setForm(prev => ({...prev, data: e.target.value}))}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none font-mono text-sm transition-all"
                        placeholder='{"user": "alice", "action": "register", "timestamp": 1693920000000}'
                        required
                    />
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                            ℹ️ 数据将编码到交易的 <code className="bg-gray-100 px-1 rounded">data</code> 字段
                        </p>
                        <p className="text-xs text-blue-600">
                            📏 {form.data.length} 字符
                        </p>
                    </div>
                </div>
                
                {/* Gas估算显示 */}
                {gasEstimate && (
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-700">⛽ 预估Gas:</span>
                            <span className="font-mono font-bold text-blue-800">
                                {parseInt(gasEstimate).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-blue-600 mt-1">
                            <span>预估费用:</span>
                            <span>~0.002 ETH</span>
                        </div>
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                        loading ? 
                            'opacity-50 cursor-not-allowed' : 
                            'hover:shadow-xl hover:-translate-y-2 active:translate-y-0 transform'
                    }`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            <span>处理中...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <span className="mr-2">🚀</span>
                            <span>发送 ETH 转账上链</span>
                        </div>
                    )}
                </button>
            </form>
            
            {/* 功能说明 */}
            <div className="mt-6 bg-blue-100 border border-blue-300 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🎯 ETH转账上链原理</h4>
                <div className="text-sm text-blue-800 space-y-1">
                    <p>• 📄 数据编码到交易的 <code className="bg-white px-1 rounded">data</code> 字段</p>
                    <p>• 🔗 通过 Ethers.js 直接与区块链交互</p>
                    <p>• 💎 支持任意JSON数据格式</p>
                    <p>• 🔍 可通过交易哈希查询完整数据</p>
                    <p>• ⛽ 自动估算和优化Gas费用</p>
                </div>
            </div>
        </div>
    );
}

// 📊 ETH转账处理逻辑
async function handleEthTransfer(params, wallet, showProgress, updateProgress, hideProgress, showToast) {
    if (!wallet.address) {
        showToast('请先连接钱包', 'error');
        return null;
    }

    try {
        showProgress('ETH转账 + 数据上链中...');
        updateProgress(1);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // 使用BigNumber.js处理精度
        const amountBN = new BigNumber(params.amount);
        const amountWei = ethers.parseEther(amountBN.toString());
        
        updateProgress(2);
        
        // 检查余额
        const balance = await provider.getBalance(wallet.address);
        const gasEstimate = ethers.parseEther("0.002"); // 预留gas费用
        
        if (balance < (amountWei + gasEstimate)) {
            throw new Error('ETH余额不足，请确保有足够的Gas费用');
        }
        
        // 编码数据
        const encodedData = ethers.hexlify(ethers.toUtf8Bytes(params.data));
        
        // 估算精确的Gas
        const gasLimit = await provider.estimateGas({
            to: params.address,
            value: amountWei,
            data: encodedData
        });
        
        updateProgress(3);
        
        // 发送交易
        const tx = await signer.sendTransaction({
            to: params.address,
            value: amountWei,
            data: encodedData,
            gasLimit: gasLimit * 120n / 100n // 增加20%缓冲
        });
        
        console.log('🚀 ETH转账交易已发送:', tx.hash);
        
        // 等待确认
        const receipt = await tx.wait();
        updateProgress(4);
        
        console.log('✅ ETH转账确认:', receipt);
        
        return {
            hash: tx.hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
            data: params.data,
            amount: params.amount,
            type: 'eth_transfer'
        };
        
    } catch (error) {
        console.error('❌ ETH转账失败:', error);
        throw error;
    }
}

// 📈 ETH转账统计信息
const ETH_TRANSFER_INFO = {
    title: '💰 ETH转账数据上链',
    method: 'Ethers.js + Transaction Data Field',
    advantages: [
        '🚀 直接与区块链交互，无需中间层',
        '💎 数据永久存储在区块链上',
        '🔍 可通过交易哈希直接查询',
        '⛽ Gas费用相对较低',
        '🛡️ 数据不可篡改'
    ],
    limitations: [
        '📏 数据大小受Gas限制',
        '💰 需要支付ETH作为转账金额',
        '⏱️ 受网络拥堵影响确认时间'
    ],
    gasUsage: {
        base: '21000 Gas (基础转账)',
        data: '每字节额外 ~16 Gas',
        example: '1KB数据 ≈ 37000 Gas'
    }
};

console.log('💰 ETH转账组件已创建！');
console.log('📊 组件信息:', ETH_TRANSFER_INFO);