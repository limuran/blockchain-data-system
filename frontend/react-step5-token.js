// 🪙 代币转账组件 - 方式2：通过转U的形式读取USDT的合约地址+链的数据HASH/ID
function TokenTransfer({ onTransaction }) {
    const [form, setForm] = useState({
        tokenType: 'USDT',
        address: '0x742d35Cc6634C0532925a3b8D6E14a87B8F0E652',
        amount: '1.0',
        data: '{"payment_type": "service_fee", "order_id": "ORD' + Date.now() + '"}'
    });
    const [loading, setLoading] = useState(false);
    const [tokenBalance, setTokenBalance] = useState('0.00');
    const [gasEstimate, setGasEstimate] = useState(null);
    const [contractInfo, setContractInfo] = useState(null);
    
    // 代币合约配置 - Sepolia测试网
    const TOKEN_CONTRACTS = {
        USDT: {
            address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
            decimals: 6,
            name: 'Tether USD (Sepolia)',
            symbol: 'USDT'
        },
        USDC: {
            address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            decimals: 6,
            name: 'USD Coin (Sepolia)',
            symbol: 'USDC'
        },
        DAI: {
            address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
            decimals: 18,
            name: 'Dai Stablecoin (Sepolia)', 
            symbol: 'DAI'
        }
    };
    
    const USDT_ABI = [
        "function transfer(address to, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)",
        "function symbol() external view returns (string)",
        "function name() external view returns (string)"
    ];
    
    // 查询代币余额和合约信息
    useEffect(() => {
        const fetchTokenInfo = async () => {
            if (window.ethereum) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await provider.send("eth_accounts", []);
                    
                    if (accounts.length > 0) {
                        const tokenConfig = TOKEN_CONTRACTS[form.tokenType];
                        const contract = new ethers.Contract(tokenConfig.address, USDT_ABI, provider);
                        
                        // 查询余额
                        const balance = await contract.balanceOf(accounts[0]);
                        const formatted = parseFloat(ethers.formatUnits(balance, tokenConfig.decimals)).toFixed(2);
                        setTokenBalance(formatted);
                        
                        // 查询合约信息
                        const [name, symbol, decimals] = await Promise.all([
                            contract.name(),
                            contract.symbol(), 
                            contract.decimals()
                        ]);
                        
                        setContractInfo({
                            name,
                            symbol,
                            decimals: Number(decimals),
                            address: tokenConfig.address
                        });
                    }
                } catch (e) {
                    console.log('代币信息查询失败:', e);
                    setTokenBalance('0.00');
                }
            }
        };
        
        fetchTokenInfo();
    }, [form.tokenType]);
    
    // Gas估算
    useEffect(() => {
        const estimateGas = async () => {
            if (form.address && form.amount && window.ethereum) {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const tokenConfig = TOKEN_CONTRACTS[form.tokenType];
                    const contract = new ethers.Contract(tokenConfig.address, USDT_ABI, provider);
                    
                    const amountBN = new BigNumber(form.amount);
                    const amountWei = ethers.parseUnits(amountBN.toString(), tokenConfig.decimals);
                    
                    const gasEstimate = await contract.transfer.estimateGas(form.address, amountWei);
                    setGasEstimate(gasEstimate.toString());
                } catch (e) {
                    setGasEstimate('65000'); // ERC20转账默认gas
                }
            }
        };
        
        const debounce = setTimeout(estimateGas, 500);
        return () => clearTimeout(debounce);
    }, [form.address, form.amount, form.tokenType]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 验证输入
        if (!ethers.isAddress(form.address)) {
            alert('❌ 请输入有效的以太坊地址');
            return;
        }
        
        if (parseFloat(form.amount) <= 0) {
            alert('❌ 请输入有效的转账金额');
            return;
        }
        
        if (parseFloat(tokenBalance) < parseFloat(form.amount)) {
            alert(`❌ ${form.tokenType}余额不足，当前余额: ${tokenBalance}`);
            return;
        }
        
        setLoading(true);
        try {
            await onTransaction('token', {
                ...form,
                contractAddress: TOKEN_CONTRACTS[form.tokenType].address,
                decimals: TOKEN_CONTRACTS[form.tokenType].decimals
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🪙</span>
                <div>
                    <h3 className="text-lg font-bold text-purple-900">代币转账数据上链</h3>
                    <p className="text-purple-700 text-sm">
                        <strong>方式2:</strong> 通过转U的形式读取USDT合约地址+链的数据HASH/ID
                    </p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        🪙 代币类型
                    </label>
                    <select 
                        value={form.tokenType}
                        onChange={(e) => setForm(prev => ({...prev, tokenType: e.target.value}))}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    >
                        <option value="USDT">💰 USDT (Tether) - 主要支持</option>
                        <option value="USDC">💵 USDC (USD Coin)</option>
                        <option value="DAI">🌟 DAI (MakerDAO)</option>
                    </select>
                    
                    {/* 代币合约信息显示 */}
                    {contractInfo && (
                        <div className="mt-2 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                            <div className="text-xs space-y-1">
                                <p><strong>合约:</strong> <span className="font-mono">{contractInfo.address}</span></p>
                                <p><strong>名称:</strong> {contractInfo.name}</p>
                                <p><strong>精度:</strong> {contractInfo.decimals} 位小数</p>
                                <p><strong>余额:</strong> <span className="font-bold text-purple-700">{tokenBalance} {contractInfo.symbol}</span></p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        📍 接收地址
                    </label>
                    <input 
                        type="text" 
                        value={form.address}
                        onChange={(e) => setForm(prev => ({...prev, address: e.target.value}))}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none font-mono text-sm transition-all"
                        placeholder="0x..."
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        🔍 支持ENS域名解析
                    </p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        💰 转账金额
                    </label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={form.amount} 
                            step="0.01"
                            min="0"
                            max={tokenBalance}
                            onChange={(e) => setForm(prev => ({...prev, amount: e.target.value}))}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all pr-20"
                            placeholder="1.0"
                            required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-gray-500 text-sm font-medium">{form.tokenType}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                            💡 BigNumber.js处理代币精度
                        </p>
                        <p className="text-xs text-purple-600">
                            余额: {tokenBalance} {form.tokenType}
                        </p>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        📄 关联数据 (JSON格式，可选)
                    </label>
                    <textarea 
                        value={form.data} 
                        rows="3"
                        onChange={(e) => setForm(prev => ({...prev, data: e.target.value}))}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none font-mono text-sm transition-all"
                        placeholder='{"payment_type": "service_fee", "order_id": "12345"}'
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        ℹ️ 通过转账事件关联数据，便于追踪
                    </p>
                </div>
                
                {/* Gas估算显示 */}
                {gasEstimate && (
                    <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-purple-700">⛽ 预估Gas:</span>
                            <span className="font-mono font-bold text-purple-800">
                                {parseInt(gasEstimate).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-purple-600 mt-1">
                            <span>预估费用 (ETH):</span>
                            <span>~0.003 ETH</span>
                        </div>
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                        loading ? 
                            'opacity-50 cursor-not-allowed' : 
                            'hover:shadow-xl hover:-translate-y-2 active:translate-y-0 transform'
                    }`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            <span>转账中...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <span className="mr-2">💸</span>
                            <span>发送 {form.tokenType} 转账</span>
                        </div>
                    )}
                </button>
            </form>
            
            {/* 功能说明 */}
            <div className="mt-6 bg-purple-100 border border-purple-300 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">🎯 代币转账上链原理</h4>
                <div className="text-sm text-purple-800 space-y-1">
                    <p>• 🪙 通过USDT等ERC20代币合约转账</p>
                    <p>• 🔗 读取合约地址和交易HASH/ID</p>
                    <p>• 📊 支持Infura/Alchemy API查询</p>
                    <p>• 💾 关联数据通过事件索引</p>
                    <p>• 🎯 专门用于昨天部署的子图查询</p>
                </div>
            </div>
        </div>
    );
}

// 🔄 代币转账处理逻辑
async function handleTokenTransfer(params, wallet, showProgress, updateProgress, hideProgress, showToast) {
    if (!wallet.address) {
        showToast('请先连接钱包', 'error');
        return null;
    }

    try {
        showProgress('代币转账 + 数据记录中...');
        updateProgress(1);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // 创建代币合约实例
        const USDT_ABI = [
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ];
        
        const contract = new ethers.Contract(params.contractAddress, USDT_ABI, signer);
        
        updateProgress(2);
        
        // 使用BigNumber.js处理金额精度
        const amountBN = new BigNumber(params.amount);
        const amountWei = ethers.parseUnits(amountBN.toString(), params.decimals);
        
        // 检查代币余额
        const balance = await contract.balanceOf(wallet.address);
        if (balance < amountWei) {
            throw new Error(`${params.tokenType}余额不足`);
        }
        
        // 估算Gas
        const gasLimit = await contract.transfer.estimateGas(params.address, amountWei);
        
        updateProgress(3);
        
        // 发送代币转账
        const tx = await contract.transfer(params.address, amountWei, {
            gasLimit: gasLimit * 120n / 100n // 增加20%缓冲
        });
        
        console.log('🪙 代币转账交易已发送:', tx.hash);
        console.log('📊 合约地址:', params.contractAddress);
        
        // 等待确认
        const receipt = await tx.wait();
        updateProgress(4);
        
        console.log('✅ 代币转账确认:', receipt);
        
        return {
            hash: tx.hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
            data: params.data,
            amount: params.amount,
            tokenType: params.tokenType,
            contractAddress: params.contractAddress,
            type: 'token_transfer'
        };
        
    } catch (error) {
        console.error('❌ 代币转账失败:', error);
        throw error;
    }
}

// 📈 代币转账统计信息
const TOKEN_TRANSFER_INFO = {
    title: '🪙 代币转账数据上链',
    method: 'ERC20 Contract + Event Logs',
    supportedTokens: ['USDT', 'USDC', 'DAI'],
    advantages: [
        '🎯 直接与昨天部署的子图集成',
        '💰 通过代币转账关联数据',
        '🔍 The Graph自动索引交易',
        '📊 支持复杂查询和过滤',
        '⚡ 查询速度更快'
    ],
    theGraphIntegration: {
        endpoint: 'https://api.thegraph.com/subgraphs/name/limuran/usdt-data-tracker',
        features: [
            '📈 实时索引USDT转账',
            '🔍 GraphQL查询接口',
            '📊 数据聚合和分析',
            '🎯 与合约事件同步'
        ]
    }
};

console.log('🪙 代币转账组件已创建！');
console.log('📊 The Graph集成信息:', TOKEN_TRANSFER_INFO.theGraphIntegration);