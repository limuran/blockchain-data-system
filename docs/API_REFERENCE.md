# API参考文档

本文档详细介绍了增强版代币转账系统的API接口和使用方法。

## 目录

- [代币工具函数](#代币工具函数)
- [交换工具函数](#交换工具函数)
- [React Hooks](#react-hooks)
- [配置管理](#配置管理)
- [错误处理](#错误处理)

## 代币工具函数

### getTokenBalance

获取指定地址的代币余额。

```javascript
getTokenBalance(provider, tokenAddress, walletAddress, decimals)
```

**参数**:
- `provider` (BrowserProvider): Ethers.js浏览器提供器实例
- `tokenAddress` (string): 代币合约地址
- `walletAddress` (string): 要查询的钱包地址
- `decimals` (number): 代币精度

**返回值**: `Promise<string>` - 格式化的余额字符串

**示例**:
```javascript
import { ethers } from 'ethers';
import { getTokenBalance } from '../utils/tokenUtils';

const provider = new ethers.BrowserProvider(window.ethereum);
const balance = await getTokenBalance(
  provider,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT地址
  '0x742...', // 用户地址
  6 // USDT精度
);
console.log(`USDT余额: ${balance}`);
```

### getETHBalance

获取指定地址的ETH余额。

```javascript
getETHBalance(provider, walletAddress)
```

**参数**:
- `provider` (BrowserProvider): Ethers.js浏览器提供器实例
- `walletAddress` (string): 要查询的钱包地址

**返回值**: `Promise<string>` - 格式化的ETH余额字符串

**示例**:
```javascript
const ethBalance = await getETHBalance(provider, userAddress);
console.log(`ETH余额: ${ethBalance}`);
```

### checkTokenApproval

检查代币授权状态。

```javascript
checkTokenApproval(provider, tokenAddress, owner, spender, amount)
```

**参数**:
- `provider` (BrowserProvider): Ethers.js浏览器提供器实例
- `tokenAddress` (string): 代币合约地址
- `owner` (string): 代币所有者地址
- `spender` (string): 被授权地址（通常是路由器或合约）
- `amount` (string): 要检查的金额（wei格式）

**返回值**: `Promise<Object>` - 授权状态对象
```javascript
{
  needsApproval: boolean,    // 是否需要授权
  currentAllowance: string   // 当前授权额度
}
```

**示例**:
```javascript
const approval = await checkTokenApproval(
  provider,
  tokenAddress,
  userAddress,
  routerAddress,
  ethers.parseUnits('100', 6).toString()
);

if (approval.needsApproval) {
  console.log('需要先进行授权');
}
```

### approveToken

执行代币授权。

```javascript
approveToken(signer, tokenAddress, spender, amount)
```

**参数**:
- `signer` (Signer): Ethers.js签名器实例
- `tokenAddress` (string): 代币合约地址
- `spender` (string): 被授权地址
- `amount` (string): 授权金额（wei格式）

**返回值**: `Promise<TransactionResponse>` - 交易响应对象

**示例**:
```javascript
// 无限授权
const tx = await approveToken(
  signer,
  tokenAddress,
  spenderAddress,
  ethers.MaxUint256
);

// 等待交易确认
const receipt = await tx.wait();
console.log('授权成功:', receipt.hash);
```

### transferToken

执行代币转账。

```javascript
transferToken(signer, tokenAddress, to, amount)
```

**参数**:
- `signer` (Signer): Ethers.js签名器实例
- `tokenAddress` (string): 代币合约地址
- `to` (string): 接收地址
- `amount` (string): 转账金额（wei格式）

**返回值**: `Promise<TransactionResponse>` - 交易响应对象

**示例**:
```javascript
const transferAmount = ethers.parseUnits('10', 6); // 10 USDT
const tx = await transferToken(
  signer,
  usdtAddress,
  recipientAddress,
  transferAmount.toString()
);

const receipt = await tx.wait();
console.log('转账成功:', receipt.hash);
```

## 交换工具函数

### getSwapQuote

获取ETH到代币的交换报价。

```javascript
getSwapQuote(provider, chainId, tokenOut, amountIn)
```

**参数**:
- `provider` (BrowserProvider): Ethers.js浏览器提供器实例
- `chainId` (number): 网络链ID
- `tokenOut` (string): 输出代币地址
- `amountIn` (string): 输入ETH数量（wei格式）

**返回值**: `Promise<string>` - 预期输出代币数量（wei格式）

**示例**:
```javascript
import { getSwapQuote } from '../utils/swapUtils';

const ethAmount = ethers.parseEther('0.1'); // 0.1 ETH
const quote = await getSwapQuote(
  provider,
  1, // 以太坊主网
  usdtAddress,
  ethAmount.toString()
);

const expectedUsdt = ethers.formatUnits(quote, 6);
console.log(`0.1 ETH 可兑换约 ${expectedUsdt} USDT`);
```

### swapETHForToken

执行ETH到代币的交换。

```javascript
swapETHForToken(signer, chainId, tokenOut, amountIn, amountOutMinimum, recipient)
```

**参数**:
- `signer` (Signer): Ethers.js签名器实例
- `chainId` (number): 网络链ID
- `tokenOut` (string): 输出代币地址
- `amountIn` (string): 输入ETH数量（wei格式）
- `amountOutMinimum` (string): 最小输出代币数量（wei格式）
- `recipient` (string): 接收地址

**返回值**: `Promise<TransactionResponse>` - 交易响应对象

**示例**:
```javascript
const ethAmount = ethers.parseEther('0.1');
const expectedTokens = await getSwapQuote(provider, chainId, tokenAddress, ethAmount.toString());
const minTokens = (BigInt(expectedTokens) * BigInt(95)) / BigInt(100); // 5%滑点

const tx = await swapETHForToken(
  signer,
  chainId,
  tokenAddress,
  ethAmount.toString(),
  minTokens.toString(),
  userAddress
);

const receipt = await tx.wait();
console.log('兑换成功:', receipt.hash);
```

### calculateETHForTokens

计算获取指定数量代币所需的ETH数量。

```javascript
calculateETHForTokens(provider, chainId, tokenOut, amountOut)
```

**参数**:
- `provider` (BrowserProvider): Ethers.js浏览器提供器实例
- `chainId` (number): 网络链ID
- `tokenOut` (string): 输出代币地址
- `amountOut` (string): 期望的代币数量（wei格式）

**返回值**: `Promise<string>` - 所需ETH数量（wei格式）

## React Hooks

### useTokenBalance

管理代币余额的React Hook。

```javascript
useTokenBalance(walletAddress, chainId)
```

**参数**:
- `walletAddress` (string): 钱包地址
- `chainId` (number): 网络链ID

**返回值**: `Object` - 余额管理对象
```javascript
{
  balances: Object,           // 代币余额映射
  ethBalance: string,         // ETH余额
  loading: boolean,           // 加载状态
  error: string|null,         // 错误信息
  fetchBalances: Function,    // 重新获取所有余额
  refreshBalance: Function,   // 刷新特定代币余额
  supportedTokens: Object     // 支持的代币列表
}
```

**示例**:
```javascript
import { useTokenBalance } from '../hooks/useTokenBalance';

function TokenBalanceDisplay({ walletAddress, chainId }) {
  const {
    balances,
    ethBalance,
    loading,
    error,
    refreshBalance
  } = useTokenBalance(walletAddress, chainId);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <div>ETH: {ethBalance}</div>
      {Object.entries(balances).map(([symbol, balance]) => (
        <div key={symbol}>
          {symbol}: {balance}
          <button onClick={() => refreshBalance(symbol)}>
            刷新
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 配置管理

### getTokensByChainId

获取指定链ID支持的代币列表。

```javascript
getTokensByChainId(chainId)
```

**参数**:
- `chainId` (number): 网络链ID

**返回值**: `Object` - 代币配置对象

**示例**:
```javascript
import { getTokensByChainId } from '../config/tokens';

const tokens = getTokensByChainId(1); // 以太坊主网
console.log(tokens.USDT); // USDT配置信息
```

### getTokenBySymbol

获取指定代币符号的配置信息。

```javascript
getTokenBySymbol(chainId, symbol)
```

**参数**:
- `chainId` (number): 网络链ID
- `symbol` (string): 代币符号

**返回值**: `Object|undefined` - 代币配置对象

### getUniswapRouter

获取指定链的Uniswap路由器地址。

```javascript
getUniswapRouter(chainId)
```

**参数**:
- `chainId` (number): 网络链ID

**返回值**: `string|undefined` - 路由器地址

### getWETHAddress

获取指定链的WETH地址。

```javascript
getWETHAddress(chainId)
```

**参数**:
- `chainId` (number): 网络链ID

**返回值**: `string|undefined` - WETH地址

## 错误处理

### 常见错误类型

1. **网络错误**
   - `NetworkError`: 网络连接问题
   - `UnsupportedNetwork`: 不支持的网络

2. **代币错误**
   - `InsufficientBalance`: 余额不足
   - `TokenNotFound`: 代币不存在
   - `ApprovalRequired`: 需要授权

3. **交换错误**
   - `QuoteError`: 获取报价失败
   - `SwapError`: 交换失败
   - `SlippageExceeded`: 滑点超限

4. **交易错误**
   - `TransactionFailed`: 交易失败
   - `GasEstimationFailed`: Gas估算失败
   - `UserRejected`: 用户拒绝

### 错误处理最佳实践

```javascript
try {
  const result = await someTokenOperation();
  console.log('操作成功:', result);
} catch (error) {
  if (error.code === 'ACTION_REJECTED') {
    console.log('用户取消了操作');
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('余额不足');
  } else if (error.code === 'NETWORK_ERROR') {
    console.log('网络连接问题');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## TypeScript支持

虽然当前项目使用JavaScript，但我们计划在未来版本中添加TypeScript支持。以下是主要类型定义的预览：

```typescript
// 代币配置类型
interface TokenConfig {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  icon: string;
  type: 'ERC20' | 'BEP20';
}

// 交换报价类型
interface SwapQuote {
  tokenAmount: string;
  ethRequired: string;
  canAfford: boolean;
}

// 余额Hook返回类型
interface UseTokenBalanceReturn {
  balances: Record<string, string>;
  ethBalance: string;
  loading: boolean;
  error: string | null;
  fetchBalances: () => Promise<void>;
  refreshBalance: (tokenSymbol: string) => void;
  supportedTokens: Record<string, TokenConfig>;
}
```