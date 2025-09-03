// 🔍 数据查询组件 - 使用The Graph把数据读回来
function DataQuery({ onQuery }) {
    const [queryMethod, setQueryMethod] = useState('ethers');
    const [target, setTarget] = useState('');
    const [graphqlQuery, setGraphqlQuery] = useState(`query GetUSDTData {
  dataStoreds(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user
    dataHash
    dataType
    timestamp
    blockNumber
    transactionHash
  }
  transfers(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    from
    to
    value
    timestamp
    blockNumber
  }
}`);
    const [loading, setLoading] = useState(false);
    const [queryResults, setQueryResults] = useState(null);
    const [activeQueryTab, setActiveQueryTab] = useState('chain');
    
    // 预定义查询模板
    const QUERY_TEMPLATES = {
        recent_data: `query GetRecentData {
  dataStoreds(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    user
    dataType
    data
    timestamp
    blockNumber
  }
}`,
        user_transfers: `query GetUserTransfers($user: String!) {
  transfers(where: {or: [{from: $user}, {to: $user}]}, first: 10) {
    id
    from
    to
    value
    timestamp
    transactionHash
  }
}`,
        data_by_type: `query GetDataByType($dataType: String!) {
  dataStoreds(where: {dataType: $dataType}, first: 10) {
    id
    user
    data
    timestamp
    dataHash
  }
}`
    };
    
    const handleQuery = async (type) => {
        if (type === 'chain' && !target.trim()) {
            alert('请输入交易哈希或合约地址');
            return;
        }
        
        setLoading(true);
        try {
            const result = await onQuery(type, { 
                queryMethod, 
                target, 
                graphqlQuery,
                endpoint: 'https://api.thegraph.com/subgraphs/name/limuran/usdt-data-tracker'
            });
            setQueryResults(result);
        } finally {
            setLoading(false);
        }
    };
    
    const loadTemplate = (templateKey) => {
        setGraphqlQuery(QUERY_TEMPLATES[templateKey]);
    };
    
    return (
        <div className="space-y-6">
            {/* 查询方式选择 */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveQueryTab('chain')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        activeQueryTab === 'chain' 
                            ? 'bg-indigo-500 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-white'
                    }`}
                >
                    🔍 链上查询
                </button>
                <button 
                    onClick={() => setActiveQueryTab('graph')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        activeQueryTab === 'graph' 
                            ? 'bg-purple-500 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-white'
                    }`}
                >
                    📈 The Graph
                </button>
            </div>
            
            {/* 链上直接查询 */}
            {activeQueryTab === 'chain' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                        🔍 区块链数据查询
                    </h3>
                    <p className="text-indigo-700 text-sm mb-4">
                        使用Ethers.js、Infura或Alchemy API直接查询链上数据
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🛠️ 查询方式
                            </label>
                            <select 
                                value={queryMethod}
                                onChange={(e) => setQueryMethod(e.target.value)}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            >
                                <option value="ethers">1️⃣ Ethers.js 直接查询</option>
                                <option value="infura">2️⃣ Infura API (需配置)</option>
                                <option value="alchemy">2️⃣ Alchemy API (需配置)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🎯 查询目标
                            </label>
                            <input 
                                type="text" 
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-mono text-sm transition-all"
                                placeholder="0x... (交易哈希、合约地址或区块号)"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 支持交易哈希、合约地址、区块号查询
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => handleQuery('chain')} 
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all ${
                                loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'
                            }`}
                        >
                            {loading ? '🔄 查询中...' : '🔍 查询链上数据'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* The Graph查询 */}
            {activeQueryTab === 'graph' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">📈</span>
                        <div>
                            <h3 className="text-lg font-bold text-purple-900">The Graph 子图查询</h3>
                            <p className="text-purple-700 text-sm">
                                连接到你昨天部署的子图: <code className="bg-purple-100 px-1 rounded text-xs">usdt-data-tracker</code>
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {/* 查询模板选择 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📝 查询模板
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => loadTemplate('recent_data')}
                                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                                >
                                    📊 最新数据
                                </button>
                                <button 
                                    onClick={() => loadTemplate('user_transfers')}
                                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                                >
                                    👤 用户转账
                                </button>
                                <button 
                                    onClick={() => loadTemplate('data_by_type')}
                                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                                >
                                    🏷️ 按类型
                                </button>
                            </div>
                        </div>
                        
                        {/* GraphQL编辑器 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📊 GraphQL 查询编辑器
                            </label>
                            <textarea 
                                value={graphqlQuery}
                                onChange={(e) => setGraphqlQuery(e.target.value)}
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none h-40 font-mono text-sm transition-all"
                                placeholder="输入GraphQL查询..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                🎯 连接到子图: limuran/usdt-data-tracker
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => handleQuery('graph')} 
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold transition-all ${
                                loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'
                            }`}
                        >
                            {loading ? '🔄 查询中...' : '▶️ 执行 GraphQL 查询'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* 查询结果显示 */}
            {queryResults && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                            <span className="mr-2">📋</span>查询结果
                        </h4>
                        <button 
                            onClick={() => setQueryResults(null)}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm overflow-auto max-h-80 text-gray-800">
                            {JSON.stringify(queryResults, null, 2)}
                        </pre>
                    </div>
                    
                    {/* 结果统计 */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="font-bold text-blue-600">
                                {queryResults?.dataStoreds?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600">数据记录</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="font-bold text-green-600">
                                {queryResults?.transfers?.length || 0}
                            </div>
                            <div className="text-xs text-gray-600">转账记录</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="font-bold text-purple-600">
                                {new Date().toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-gray-600">查询时间</div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* The Graph功能说明 */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-xl p-6">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <span className="mr-2">📈</span>The Graph 集成优势
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2 text-purple-800">
                        <p>• 🚀 <strong>实时索引:</strong> 自动同步链上数据</p>
                        <p>• 🔍 <strong>GraphQL:</strong> 灵活的查询语言</p>
                        <p>• ⚡ <strong>高性能:</strong> 比直接查询快100倍</p>
                        <p>• 📊 <strong>聚合分析:</strong> 支持复杂数据统计</p>
                    </div>
                    <div className="space-y-2 text-purple-800">
                        <p>• 🎯 <strong>昨天部署:</strong> usdt-data-tracker</p>
                        <p>• 🔗 <strong>多链支持:</strong> 同步多个合约</p>
                        <p>• 📈 <strong>历史数据:</strong> 完整的历史记录</p>
                        <p>• 🛡️ <strong>去中心化:</strong> 分布式索引网络</p>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                    <p className="text-xs text-purple-700">
                        <strong>🔗 子图端点:</strong> 
                        <code className="bg-purple-200 px-2 py-1 rounded ml-1">
                            https://api.thegraph.com/subgraphs/name/limuran/usdt-data-tracker
                        </code>
                    </p>
                </div>
            </div>
        </div>
    );
}

// 🔍 链上数据查询逻辑
async function handleChainQuery(params, showProgress, updateProgress, hideProgress, showToast) {
    try {
        showProgress('查询链上数据中...');
        updateProgress(1);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        let result = {};
        
        updateProgress(2);
        
        switch (params.queryMethod) {
            case 'ethers':
                // Ethers.js直接查询
                if (params.target.startsWith('0x') && params.target.length === 66) {
                    // 交易哈希查询
                    const tx = await provider.getTransaction(params.target);
                    const receipt = await provider.getTransactionReceipt(params.target);
                    
                    result = {
                        type: 'transaction',
                        hash: tx.hash,
                        from: tx.from,
                        to: tx.to,
                        value: ethers.formatEther(tx.value || 0),
                        gasUsed: receipt?.gasUsed?.toString(),
                        blockNumber: tx.blockNumber,
                        data: tx.data,
                        status: receipt?.status
                    };
                } else if (params.target.startsWith('0x') && params.target.length === 42) {
                    // 合约地址查询
                    const code = await provider.getCode(params.target);
                    const balance = await provider.getBalance(params.target);
                    
                    result = {
                        type: 'contract',
                        address: params.target,
                        hasCode: code !== '0x',
                        ethBalance: ethers.formatEther(balance),
                        codeSize: Math.floor((code.length - 2) / 2) + ' bytes'
                    };
                } else {
                    // 区块号查询
                    const blockNumber = parseInt(params.target);
                    const block = await provider.getBlock(blockNumber);
                    
                    result = {
                        type: 'block',
                        number: block.number,
                        hash: block.hash,
                        timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                        transactions: block.transactions.length,
                        gasUsed: block.gasUsed.toString()
                    };
                }
                break;
                
            case 'infura':
            case 'alchemy':
                // API查询 (模拟)
                result = {
                    type: 'api_query',
                    method: params.queryMethod,
                    target: params.target,
                    status: '需要配置API密钥',
                    note: '请在配置文件中添加相应的API密钥'
                };
                break;
        }
        
        updateProgress(3);
        await new Promise(r => setTimeout(r, 500));
        updateProgress(4);
        
        return result;
        
    } catch (error) {
        console.error('❌ 链上查询失败:', error);
        throw new Error('查询失败: ' + error.message);
    }
}

// 📈 The Graph查询逻辑
async function handleGraphQuery(params, showProgress, updateProgress, hideProgress, showToast) {
    try {
        showProgress('执行 The Graph 查询...');
        updateProgress(1);
        
        const response = await fetch(params.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: params.graphqlQuery
            })
        });
        
        updateProgress(2);
        
        if (!response.ok) {
            throw new Error(`The Graph API错误: ${response.status}`);
        }
        
        const result = await response.json();
        
        updateProgress(3);
        await new Promise(r => setTimeout(r, 500));
        updateProgress(4);
        
        if (result.errors) {
            throw new Error('GraphQL错误: ' + result.errors.map(e => e.message).join(', '));
        }
        
        console.log('📈 The Graph查询结果:', result);
        
        return result.data;
        
    } catch (error) {
        console.error('❌ The Graph查询失败:', error);
        throw new Error('The Graph查询失败: ' + error.message);
    }
}

// 📊 查询功能统计信息
const QUERY_INFO = {
    title: '🔍 区块链数据查询系统',
    methods: {
        ethers: {
            name: 'Ethers.js 直接查询',
            advantages: ['🚀 直接与节点通信', '🔒 最高安全性', '💎 实时数据'],
            limitations: ['⏱️ 查询速度较慢', '💰 消耗较多资源']
        },
        infura: {
            name: 'Infura API',
            advantages: ['⚡ 查询速度快', '🌐 稳定的基础设施', '📊 丰富的API'],
            limitations: ['🔑 需要API密钥', '📈 有请求限制']
        },
        alchemy: {
            name: 'Alchemy API', 
            advantages: ['🔥 性能优异', '🛠️ 开发工具丰富', '📈 高级分析'],
            limitations: ['🔑 需要API密钥', '💰 高级功能收费']
        },
        theGraph: {
            name: 'The Graph 子图',
            advantages: ['📈 GraphQL查询', '⚡ 超快查询速度', '📊 复杂聚合', '🎯 专门索引'],
            limitations: ['🕐 索引延迟', '📝 需要部署子图']
        }
    }
};

console.log('🔍 数据查询组件已创建！');
console.log('📊 支持的查询方式:', Object.keys(QUERY_INFO.methods));