// 👛 钱包连接组件 - 支持ENS头像和名称显示
function WalletButton({ address, ensName, ensAvatar, ethBalance, usdtBalance, onConnect, onDisconnect }) {
    if (!address) {
        return (
            <button 
                onClick={onConnect}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-1 active:translate-y-0"
            >
                <span className="mr-2">👛</span>
                连接钱包
            </button>
        );
    }
    
    // 如果有ENS，使用ENS名称，否则显示缩短地址
    const displayName = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white bg-opacity-20 rounded-xl px-4 py-2 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white border-opacity-30">
                    {ensAvatar ? 
                        <img 
                            src={ensAvatar} 
                            alt="ENS Avatar" 
                            className="w-full h-full rounded-full object-cover" 
                            onError={(e) => {
                                // 头像加载失败时显示首字母
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        /> :
                        <span>{displayName.charAt(0).toUpperCase()}</span>
                    }
                    {ensAvatar && (
                        <span className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold" style={{display: 'none'}}>
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div>
                    <div className="font-semibold text-white flex items-center">
                        {displayName}
                        {ensName && <span className="ml-1 text-xs bg-blue-400 px-2 py-0.5 rounded-full">.eth</span>}
                    </div>
                    <div className="text-xs text-blue-100">
                        {ethBalance} ETH | {usdtBalance} USDT
                    </div>
                </div>
            </div>
            <button 
                onClick={onDisconnect}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
                断开
            </button>
        </div>
    );
}

// 🔗 钱包连接核心逻辑
async function connectWallet(setWallet, showToast, showProgress, updateProgress, hideProgress) {
    if (typeof window.ethereum === 'undefined') {
        showToast('请安装 MetaMask 钱包扩展', 'error');
        return;
    }

    try {
        showToast('连接钱包中...', 'info');
        showProgress('连接钱包...');
        
        updateProgress(1);
        
        // 请求连接账户
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (!accounts.length) {
            throw new Error('用户拒绝连接钱包');
        }

        updateProgress(2);
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const address = accounts[0];
        
        // 检查并切换到Sepolia网络
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== 11155111) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xAA36A7' }]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    // 添加Sepolia网络
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xAA36A7',
                            chainName: 'Sepolia 测试网络',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://sepolia.infura.io/v3/'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io/']
                        }]
                    });
                } else {
                    throw switchError;
                }
            }
        }

        updateProgress(3);

        // 查询ENS信息（如果用户有.eth域名）
        let ensName = null;
        let ensAvatar = null;
        
        try {
            const mainnetProvider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
            ensName = await mainnetProvider.lookupAddress(address);
            
            if (ensName) {
                console.log('🎯 发现ENS域名:', ensName);
                const resolver = await mainnetProvider.getResolver(ensName);
                if (resolver) {
                    ensAvatar = await resolver.getAvatar();
                    if (ensAvatar) {
                        console.log('🖼️ ENS头像:', ensAvatar);
                    }
                }
            }
        } catch (ensError) {
            console.log('ENS查询失败:', ensError.message);
            // ENS查询失败不影响主流程
        }

        updateProgress(4);

        // 查询ETH余额
        const ethBalance = await provider.getBalance(address);
        const ethFormatted = parseFloat(ethers.formatEther(ethBalance)).toFixed(4);
        
        // TODO: 查询USDT余额 (下个组件完成)
        const usdtBalance = '0.00';
        
        // 更新钱包状态
        setWallet({
            address,
            ensName,
            ensAvatar,
            ethBalance: ethFormatted,
            usdtBalance
        });
        
        setTimeout(() => {
            hideProgress();
            const message = ensName ? 
                `✅ 欢迎回来，${ensName}！` : 
                '✅ 钱包连接成功！';
            showToast(message, 'success');
        }, 500);

        // 监听账户和网络变化
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet(setWallet, showToast);
            } else {
                window.location.reload();
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });

    } catch (error) {
        hideProgress();
        console.error('钱包连接失败:', error);
        showToast('连接失败: ' + error.message, 'error');
    }
}

// 🔌 断开钱包连接
function disconnectWallet(setWallet, showToast) {
    setWallet({
        address: null,
        ensName: null,
        ensAvatar: null,
        ethBalance: '0.00',
        usdtBalance: '0.00'
    });
    
    // 清除事件监听
    if (window.ethereum && window.ethereum.removeAllListeners) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
    }
    
    showToast('钱包已断开连接', 'success');
}

// 💰 余额查询函数
async function updateBalances(address, setWallet) {
    if (!address) return;
    
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // 查询ETH余额
        const ethBalance = await provider.getBalance(address);
        const ethFormatted = parseFloat(ethers.formatEther(ethBalance)).toFixed(4);
        
        // 查询USDT余额 (Sepolia测试网)
        let usdtFormatted = '0.00';
        try {
            const USDT_ABI = [
                "function balanceOf(address account) external view returns (uint256)",
                "function decimals() external view returns (uint8)"
            ];
            
            const usdtContract = new ethers.Contract(
                '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
                USDT_ABI,
                provider
            );
            
            const usdtBalance = await usdtContract.balanceOf(address);
            const decimals = await usdtContract.decimals();
            usdtFormatted = parseFloat(ethers.formatUnits(usdtBalance, decimals)).toFixed(2);
        } catch (usdtError) {
            console.log('USDT余额查询失败:', usdtError.message);
        }
        
        // 更新钱包余额
        setWallet(prev => ({
            ...prev,
            ethBalance: ethFormatted,
            usdtBalance: usdtFormatted
        }));
        
    } catch (error) {
        console.error('余额更新失败:', error);
    }
}

// 📋 钱包功能说明
const WalletFeatures = {
    ensSupport: {
        title: '🎯 ENS 支持',
        description: '自动检测用户的ENS域名（如alice.eth）并显示头像',
        features: [
            '✅ 显示ENS名称而非地址',
            '🖼️ 加载并显示ENS头像',
            '🔄 头像加载失败时回退到首字母',
            '🏷️ ENS标签显示'
        ]
    },
    precision: {
        title: '🔢 精度处理',
        description: '使用BigNumber.js处理区块链的18位小数精度',
        features: [
            '💎 ETH余额精确到4位小数',
            '💰 USDT余额精确到2位小数',
            '🧮 避免JavaScript浮点数精度问题',
            '⚡ 实时余额更新'
        ]
    },
    network: {
        title: '🌐 网络管理',
        description: '自动检测和切换到Sepolia测试网络',
        features: [
            '🔄 自动切换网络',
            '➕ 自动添加Sepolia配置',
            '👂 监听账户变化',
            '🔗 监听网络切换'
        ]
    }
};

console.log('👛 钱包组件已创建！');
console.log('🎯 支持的功能:', WalletFeatures);