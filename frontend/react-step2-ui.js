// 🍞 Toast通知组件
function Toast({ message, type, show, onHide }) {
    useEffect(() => { 
        if (show) {
            const timer = setTimeout(onHide, 3500);
            return () => clearTimeout(timer);
        }
    }, [show, onHide]);
    
    if (!show) return null;
    
    const styles = {
        success: 'bg-green-50 border-green-500 text-green-800',
        error: 'bg-red-50 border-red-500 text-red-800',
        info: 'bg-blue-50 border-blue-500 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-500 text-yellow-800'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    return (
        <div className={`fixed top-4 right-4 ${styles[type]} border-l-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300`}
             style={{
                 animation: 'slideIn 0.3s ease-out',
                 transform: show ? 'translateX(0)' : 'translateX(100%)'
             }}>
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <span className="mr-2 text-lg">{icons[type]}</span>
                    <span className="text-sm font-medium">{message}</span>
                </div>
                <button 
                    onClick={onHide} 
                    className="ml-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

// ⏳ 进度条弹窗组件 
function Progress({ show, title, step, onHide }) {
    if (!show) return null;
    
    const steps = [
        '🔄 初始化交易',
        '✅ 验证参数', 
        '📡 广播交易',
        '🎉 确认完成'
    ];
    const progress = Math.min((step / 4) * 100, 100);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-2xl p-8 min-w-96 max-w-md relative shadow-2xl border border-white border-opacity-20">
                <button 
                    onClick={onHide} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
                >
                    ×
                </button>
                
                <h3 className="text-xl font-bold text-center mb-6 text-gray-800">{title}</h3>
                
                {/* 进度条 */}
                <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center" 
                        style={{width: `${progress}%`}}
                    >
                        <span className="text-white text-xs font-bold">
                            {progress > 20 ? `${Math.round(progress)}%` : ''}
                        </span>
                    </div>
                </div>
                
                {/* 步骤列表 */}
                <div className="space-y-3">
                    {steps.map((text, i) => (
                        <div 
                            key={i} 
                            className={`flex items-center p-4 rounded-lg transition-all duration-300 ${
                                i < step ? 'bg-green-50 border-l-4 border-green-500' :
                                i === step ? 'bg-blue-50 border-l-4 border-blue-500' : 
                                'bg-gray-50 border-l-4 border-gray-300'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                                i < step ? 'bg-green-500 text-white' :
                                i === step ? 'bg-blue-500 text-white animate-pulse' : 
                                'bg-gray-300 text-gray-600'
                            }`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`font-medium ${
                                i < step ? 'text-green-700' :
                                i === step ? 'text-blue-700' :
                                'text-gray-500'
                            }`}>
                                {text}
                            </span>
                        </div>
                    ))}
                </div>
                
                {/* 当前操作状态 */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 text-center">
                        {step === 0 && '🔄 准备开始...'}
                        {step === 1 && '🔍 正在验证交易参数...'}
                        {step === 2 && '📡 正在广播到区块链网络...'}
                        {step === 3 && '⏳ 等待区块确认...'}
                        {step === 4 && '🎉 交易成功完成！'}
                    </p>
                </div>
            </div>
        </div>
    );
}

// CSS动画样式
const styles = `
    <style>
        @keyframes slideIn {
            from { 
                transform: translateX(100%); 
                opacity: 0; 
            }
            to { 
                transform: translateX(0); 
                opacity: 1; 
            }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-bounce-in {
            animation: bounceIn 0.6s ease-out;
        }
        
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
    </style>
`;

// 💡 组件使用说明
const ComponentDocs = `
/**
 * 🍞 Toast 组件使用说明
 * 
 * 功能：显示成功/错误/信息提示
 * 
 * Props:
 * - message: 提示信息
 * - type: 'success' | 'error' | 'info' | 'warning'
 * - show: 是否显示
 * - onHide: 隐藏回调
 * 
 * 使用示例:
 * const [toast, setToast] = useState({show: false, message: '', type: 'info'});
 * const showToast = (msg, type) => setToast({show: true, message: msg, type});
 * const hideToast = () => setToast(prev => ({...prev, show: false}));
 * 
 * <Toast {...toast} onHide={hideToast} />
 */

/**
 * ⏳ Progress 组件使用说明
 * 
 * 功能：显示交易/操作进度
 * 
 * Props:
 * - show: 是否显示
 * - title: 进度标题
 * - step: 当前步骤 (0-4)
 * - onHide: 关闭回调
 * 
 * 使用示例:
 * const [progress, setProgress] = useState({show: false, title: '', step: 0});
 * const showProgress = (title) => setProgress({show: true, title, step: 0});
 * const updateProgress = (step) => setProgress(prev => ({...prev, step}));
 * const hideProgress = () => setProgress({show: false, title: '', step: 0});
 */
`;

console.log('📚 Toast和Progress组件已创建！');
console.log(ComponentDocs);