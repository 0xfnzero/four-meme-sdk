<div align="center">
    <h1>🚀 FOUR Trading SDK</h1>
    <h3><em>A comprehensive TypeScript SDK for seamless FOUR.meme token trading on BSC</em></h3>
</div>

<p align="center">
    <strong>Integrate FOUR.meme token trading, price calculation, and event monitoring into your applications with powerful tools and unified interfaces.</strong>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@fnzero/four-trading-sdk">
        <img src="https://img.shields.io/npm/v/@fnzero/four-trading-sdk.svg" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/@fnzero/four-trading-sdk">
        <img src="https://img.shields.io/npm/dm/@fnzero/four-trading-sdk.svg" alt="npm downloads">
    </a>
    <a href="https://github.com/0xfnzero/four-trading-sdk/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
    <a href="https://github.com/0xfnzero/four-trading-sdk">
        <img src="https://img.shields.io/github/stars/0xfnzero/four-trading-sdk?style=social" alt="GitHub stars">
    </a>
    <a href="https://github.com/0xfnzero/four-trading-sdk/network">
        <img src="https://img.shields.io/github/forks/0xfnzero/four-trading-sdk?style=social" alt="GitHub forks">
    </a>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/BSC-F0B90B?style=for-the-badge&logo=binance&logoColor=white" alt="Binance Smart Chain">
    <img src="https://img.shields.io/badge/FOUR.meme-FF6B6B?style=for-the-badge&logo=ethereum&logoColor=white" alt="FOUR.meme">
    <img src="https://img.shields.io/badge/DeFi-4B8BBE?style=for-the-badge&logo=bitcoin&logoColor=white" alt="DeFi Trading">
</p>

<p align="center">
    <a href="#中文">中文</a> |
    <a href="#english">English</a> |
    <a href="https://fnzero.dev/">Website</a> |
    <a href="https://t.me/fnzero_group">Telegram</a> |
    <a href="https://discord.gg/vuazbGkqQE">Discord</a>
</p>

---

<a name="english"></a>
## 📖 English Documentation

### ✨ Features

- 🔄 **Complete Trading Functions**: Buy, sell, and create tokens with ease
- 💰 **Price Calculation**: Real-time price quotes and slippage protection
- 📊 **Event Monitoring**: Subscribe to token creation, purchase, and sale events
- 🌐 **WebSocket Support**: Real-time updates via WebSocket connections
- 🛡️ **Type Safe**: Full TypeScript support with comprehensive type definitions
- 🔧 **Utility Functions**: Helper functions for formatting, parsing, and validation
- ⚡ **High Performance**: Optimized for speed and reliability
- 🎯 **Production Ready**: Battle-tested and production-grade code

### 📦 Installation

```bash
npm install @fnzero/four-trading-sdk
```

or

```bash
yarn add @fnzero/four-trading-sdk
```

or

```bash
pnpm add @fnzero/four-trading-sdk
```

### 🚀 Quick Start

```typescript
import { FourTrading } from '@fnzero/four-trading-sdk';
import { ethers } from 'ethers';

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',
  wssUrl: 'wss://bsc-rpc.publicnode.com',  // Required for events
  privateKey: 'your-private-key'
});

// Define amounts (SDK requires bigint)
const bnbAmount = ethers.parseEther('0.1');

// Get price quote
const quote = await trading.quoteBuy('0xTokenAddress', bnbAmount);
console.log(`Estimated tokens: ${quote.tokenAmount}`);

// Calculate minimum with slippage protection
const minAmount = (quote.tokenAmount * 99n) / 100n; // 1% slippage

// Buy tokens
const result = await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: bnbAmount,
  minAmount: minAmount
});

console.log(`Transaction successful: ${result.txHash}`);
```

### 💡 Core Functions

#### Initialize SDK

```typescript
import { FourTrading } from '@fnzero/four-trading-sdk';

// ⚠️ IMPORTANT: wssUrl is REQUIRED for event subscriptions
const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',     // HTTP RPC for transactions
  wssUrl: 'wss://bsc-rpc.publicnode.com',         // WebSocket for events (required)
  privateKey: 'your-private-key'
});

// Why separate URLs?
// - rpcUrl (HTTP): Used for contract transactions (buy/sell/queries)
// - wssUrl (WebSocket): Used for real-time event subscriptions
// - Event subscriptions CANNOT use HTTP polling, WebSocket is mandatory
```

#### Buy Tokens

```typescript
import { ethers } from 'ethers';

// Method 1: Buy with BNB amount (recommended)
const bnbAmount = ethers.parseEther('0.1');
const minTokenAmount = ethers.parseUnits('1000', 18);

await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: bnbAmount,      // Amount of BNB to spend (bigint)
  minAmount: minTokenAmount,   // Minimum tokens to receive (bigint)
  to: '0xRecipient'            // Optional: recipient address
});

// Method 2: Buy exact token amount
const exactTokens = ethers.parseUnits('1000', 18);
const maxBNB = ethers.parseEther('0.2');

await trading.buyTokenExact(
  '0xTokenAddress',
  exactTokens,      // Exact token amount (bigint)
  maxBNB,           // Maximum BNB to spend (bigint)
  '0xRecipient'     // Optional: recipient address
);
```

#### Sell Tokens

```typescript
import { ethers } from 'ethers';

// First, approve token spending
const tokenAmount = ethers.parseUnits('1000', 18);
await trading.approveToken('0xTokenAddress', tokenAmount);

// Then sell tokens
const minBNB = ethers.parseEther('0.1');

await trading.sellToken({
  tokenAddress: '0xTokenAddress',
  amount: tokenAmount,  // Amount of tokens to sell (bigint)
  minFunds: minBNB      // Minimum BNB to receive (bigint)
});
```

#### Price Queries

```typescript
import { ethers } from 'ethers';

// Get buy quote
const bnbAmount = ethers.parseEther('0.1');
const buyQuote = await trading.quoteBuy('0xTokenAddress', bnbAmount);
console.log(`Tokens: ${buyQuote.tokenAmount}`);
console.log(`Fee: ${buyQuote.fee}`);
console.log(`Price per token: ${buyQuote.pricePerToken}`);

// Get sell quote
const tokenAmount = ethers.parseUnits('1000', 18);
const sellQuote = await trading.quoteSell('0xTokenAddress', tokenAmount);
console.log(`BNB received: ${sellQuote.bnbCost}`);
console.log(`Fee: ${sellQuote.fee}`);

// Get current price
const currentPrice = await trading.getCurrentPrice('0xTokenAddress');
console.log(`Current price: ${currentPrice} BNB`);

// Calculate with slippage protection
const buyWithSlippage = await trading.calculateBuyWithSlippage(
  '0xTokenAddress',
  bnbAmount,    // BNB amount (bigint)
  1             // 1% slippage (number)
);
```

#### Token Information

```typescript
// Get token info
const tokenInfo = await trading.getTokenInfo('0xTokenAddress');
console.log(tokenInfo);

// Get wallet balances
const bnbBalance = await trading.getBNBBalance();
const tokenBalance = await trading.getTokenBalance('0xTokenAddress');
```

#### Event Subscription

```typescript
// Subscribe to token creation events
const createListener = trading.onTokenCreate((event) => {
  console.log('New token created:', event.token);
  console.log('Creator:', event.creator);
  console.log('Name:', event.name);
  console.log('Symbol:', event.symbol);
});

// Subscribe to purchase events
const purchaseListener = trading.onTokenPurchase((event) => {
  console.log('Token purchased:', event.token);
  console.log('Amount:', event.amount);
  console.log('Cost:', event.cost);
}, '0xTokenAddress'); // Optional: filter by token address

// Subscribe to sale events
const saleListener = trading.onTokenSale((event) => {
  console.log('Token sold:', event.token);
  console.log('Amount:', event.amount);
  console.log('Revenue:', event.cost);
});

// Unsubscribe
trading.off(createListener);
trading.off(purchaseListener);
trading.off(saleListener);
```

#### Query Historical Events

```typescript
// Get token creation events
const createEvents = await trading.getTokenCreateEvents(0, 'latest');

// Get purchase events for specific token
const purchaseEvents = await trading.getTokenPurchaseEvents(
  '0xTokenAddress',
  startBlock,
  endBlock
);

// Get sale events
const saleEvents = await trading.getTokenSaleEvents('0xTokenAddress');
```

### 🛠️ Utility Functions

```typescript
import {
  formatBNB,
  formatTokenAmount,
  parseBNB,
  parseTokenAmount,
  calculatePriceChange,
  isValidAddress,
  normalizeAddress,
  parseTradeEvents,
  getTransactionType,
  calculateGasCost
} from '@fnzero/four-trading-sdk';

// Format amounts
const bnbFormatted = formatBNB(1000000000000000000n); // "1.0"
const tokenFormatted = formatTokenAmount(1000000000000000000n); // "1.0"

// Parse amounts
const bnbWei = parseBNB('1.0'); // 1000000000000000000n
const tokenWei = parseTokenAmount('1.0'); // 1000000000000000000n

// Calculate price change
const change = calculatePriceChange(100n, 110n); // 10%

// Validate address
const isValid = isValidAddress('0x...');

// Parse transaction events
const receipt = await provider.getTransactionReceipt(txHash);
const { purchases, sales } = await parseTradeEvents(receipt, contract);

// Get transaction type
const txType = getTransactionType(tx); // 'buyTokenAMAP' | 'sellToken' | etc.

// Calculate gas cost
const gasCost = calculateGasCost(receipt); // "0.001" (BNB)
```

### ⚠️ Error Handling

```typescript
import { ethers } from 'ethers';

try {
  const bnbAmount = ethers.parseEther('0.1');

  const result = await trading.buyToken({
    tokenAddress: '0xTokenAddress',
    fundsInBNB: bnbAmount
  });
  console.log('Success:', result.txHash);
} catch (error) {
  console.error('Transaction failed:', error.message);
  // Handle error: insufficient balance, slippage exceeded, etc.
}
```

### 💡 Important: Amount Handling

**All amount parameters MUST be `bigint` type:**

```typescript
import { ethers } from 'ethers';

// ✅ Correct - Use ethers to convert amounts
const bnbAmount = ethers.parseEther('0.1');           // BNB amount
const tokenAmount = ethers.parseUnits('1000', 18);    // Token amount
const gasPrice = ethers.parseUnits('5', 'gwei');      // Gas price

// ✅ Correct - Use bigint literal for simple values
const gasLimit = 500000n;
const minAmount = 0n;

// ❌ Wrong - Numbers and strings are not accepted
fundsInBNB: 0.1        // ❌ TypeError
fundsInBNB: '0.1'      // ❌ TypeError
```

**Why bigint?**
- Prevents precision loss in large numbers
- Native blockchain amount representation (wei)
- Type-safe calculations enforced by TypeScript
- No confusion about decimal places

### 📘 TypeScript Support

The SDK is written in TypeScript and provides complete type definitions:

```typescript
import {
  FourTrading,
  FourTradingConfig,
  BuyParams,
  SellParams,
  TokenInfo,
  PriceInfo,
  TransactionResult,
  TokenCreateEvent,
  TokenPurchaseEvent,
  TokenSaleEvent
} from '@fnzero/four-trading-sdk';
```

### 📋 Contract Information

- **Contract Address**: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- **Chain**: Binance Smart Chain (BSC)
- **Chain ID**: 56
- **Network**: Mainnet
- **Block Explorer**: [BscScan](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)

### 🔧 Requirements

- Node.js >= 18.0.0
- BSC RPC endpoint
- Private key with BNB for gas fees

### 📄 License

MIT License - see the [LICENSE](LICENSE) file for details

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### 📞 Support

- GitHub Issues: [Report a bug](https://github.com/0xfnzero/four-trading-sdk/issues)
- Documentation: [Full API Documentation](https://github.com/0xfnzero/four-trading-sdk#readme)

---

<a name="中文"></a>

<div align="center">
    <h1>🚀 FOUR Trading SDK</h1>
    <h3><em>在 BSC 上无缝交易 FOUR.meme 代币的综合 TypeScript SDK</em></h3>
</div>

<p align="center">
    <strong>通过强大的工具和统一的接口，将 FOUR.meme 代币交易、价格计算和事件监控集成到您的应用程序中。</strong>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@fnzero/four-trading-sdk">
        <img src="https://img.shields.io/npm/v/@fnzero/four-trading-sdk.svg" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/@fnzero/four-trading-sdk">
        <img src="https://img.shields.io/npm/dm/@fnzero/four-trading-sdk.svg" alt="npm downloads">
    </a>
    <a href="https://github.com/0xfnzero/four-trading-sdk/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
    <a href="https://github.com/0xfnzero/four-trading-sdk">
        <img src="https://img.shields.io/github/stars/0xfnzero/four-trading-sdk?style=social" alt="GitHub stars">
    </a>
    <a href="https://github.com/0xfnzero/four-trading-sdk/network">
        <img src="https://img.shields.io/github/forks/0xfnzero/four-trading-sdk?style=social" alt="GitHub forks">
    </a>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/BSC-F0B90B?style=for-the-badge&logo=binance&logoColor=white" alt="Binance Smart Chain">
    <img src="https://img.shields.io/badge/FOUR.meme-FF6B6B?style=for-the-badge&logo=ethereum&logoColor=white" alt="FOUR.meme">
    <img src="https://img.shields.io/badge/DeFi-4B8BBE?style=for-the-badge&logo=bitcoin&logoColor=white" alt="DeFi Trading">
</p>

<p align="center">
    <a href="#english">English</a> |
    <a href="#中文">中文</a> |
    <a href="https://fnzero.dev/">Website</a> |
    <a href="https://t.me/fnzero_group">Telegram</a> |
    <a href="https://discord.gg/vuazbGkqQE">Discord</a>
</p>

---

## 📖 中文文档

### ✨ 特性

- 🔄 **完整交易功能**：轻松买入、卖出和创建代币
- 💰 **价格计算**：实时价格查询和滑点保护
- 📊 **事件监控**：订阅代币创建、购买和出售事件
- 🌐 **WebSocket 支持**：通过 WebSocket 连接实时更新
- 🛡️ **类型安全**：完整的 TypeScript 支持和类型定义
- 🔧 **实用函数**：用于格式化、解析和验证的辅助函数
- ⚡ **高性能**：优化速度和可靠性
- 🎯 **生产就绪**：经过实战检验的生产级代码

### 📦 安装

```bash
npm install @fnzero/four-trading-sdk
```

或

```bash
yarn add @fnzero/four-trading-sdk
```

或

```bash
pnpm add @fnzero/four-trading-sdk
```

### 🚀 快速开始

```typescript
import { FourTrading } from '@fnzero/four-trading-sdk';
import { ethers } from 'ethers';

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',
  wssUrl: 'wss://bsc-rpc.publicnode.com',  // 事件订阅必需
  privateKey: '你的私钥'
});

// 定义金额（SDK 要求 bigint 类型）
const bnbAmount = ethers.parseEther('0.1');

// 获取价格报价
const quote = await trading.quoteBuy('0xTokenAddress', bnbAmount);
console.log(`预计获得代币数量: ${quote.tokenAmount}`);

// 计算滑点保护的最小值
const minAmount = (quote.tokenAmount * 99n) / 100n; // 1% 滑点

// 买入代币
const result = await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: bnbAmount,
  minAmount: minAmount
});

console.log(`交易成功: ${result.txHash}`);
```

### 💡 核心功能

#### 初始化 SDK

```typescript
import { FourTrading } from '@fnzero/four-trading-sdk';

// ⚠️ 重要：wssUrl 是事件订阅的必需参数
const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',     // HTTP RPC用于交易
  wssUrl: 'wss://bsc-rpc.publicnode.com',         // WebSocket用于事件（必需）
  privateKey: '你的私钥'
});

// 为什么要分离URL？
// - rpcUrl (HTTP): 用于合约交易（买入/卖出/查询）
// - wssUrl (WebSocket): 用于实时事件订阅
// - 事件订阅不能使用HTTP轮询，WebSocket是强制要求的
```

#### 买入代币

```typescript
import { ethers } from 'ethers';

// 方法 1：使用 BNB 金额买入（推荐）
const bnbAmount = ethers.parseEther('0.1');
const minTokenAmount = ethers.parseUnits('1000', 18);

await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: bnbAmount,        // 要花费的 BNB 数量（bigint）
  minAmount: minTokenAmount,     // 最少接收的代币数量（bigint）
  to: '0xRecipient'              // 可选：接收地址
});

// 方法 2：买入精确数量的代币
const exactTokens = ethers.parseUnits('1000', 18);
const maxBNB = ethers.parseEther('0.2');

await trading.buyTokenExact(
  '0xTokenAddress',
  exactTokens,      // 精确的代币数量（bigint）
  maxBNB,           // 最多花费的 BNB（bigint）
  '0xRecipient'     // 可选：接收地址
);
```

#### 卖出代币

```typescript
import { ethers } from 'ethers';

// 首先，授权代币使用
const tokenAmount = ethers.parseUnits('1000', 18);
await trading.approveToken('0xTokenAddress', tokenAmount);

// 然后卖出代币
const minBNB = ethers.parseEther('0.1');

await trading.sellToken({
  tokenAddress: '0xTokenAddress',
  amount: tokenAmount,  // 要卖出的代币数量（bigint）
  minFunds: minBNB      // 最少接收的 BNB（bigint）
});
```

#### 价格查询

```typescript
import { ethers } from 'ethers';

// 获取买入报价
const bnbAmount = ethers.parseEther('0.1');
const buyQuote = await trading.quoteBuy('0xTokenAddress', bnbAmount);
console.log(`代币数量: ${buyQuote.tokenAmount}`);
console.log(`手续费: ${buyQuote.fee}`);
console.log(`每个代币价格: ${buyQuote.pricePerToken}`);

// 获取卖出报价
const tokenAmount = ethers.parseUnits('1000', 18);
const sellQuote = await trading.quoteSell('0xTokenAddress', tokenAmount);
console.log(`获得 BNB: ${sellQuote.bnbCost}`);
console.log(`手续费: ${sellQuote.fee}`);

// 获取当前价格
const currentPrice = await trading.getCurrentPrice('0xTokenAddress');
console.log(`当前价格: ${currentPrice} BNB`);

// 使用滑点保护计算
const buyWithSlippage = await trading.calculateBuyWithSlippage(
  '0xTokenAddress',
  bnbAmount,    // BNB 数量（bigint）
  1             // 1% 滑点（number）
);
```

#### 代币信息

```typescript
// 获取代币信息
const tokenInfo = await trading.getTokenInfo('0xTokenAddress');
console.log(tokenInfo);

// 获取钱包余额
const bnbBalance = await trading.getBNBBalance();
const tokenBalance = await trading.getTokenBalance('0xTokenAddress');
```

#### 事件订阅

```typescript
// 订阅代币创建事件
const createListener = trading.onTokenCreate((event) => {
  console.log('新代币创建:', event.token);
  console.log('创建者:', event.creator);
  console.log('名称:', event.name);
  console.log('符号:', event.symbol);
});

// 订阅购买事件
const purchaseListener = trading.onTokenPurchase((event) => {
  console.log('代币购买:', event.token);
  console.log('数量:', event.amount);
  console.log('花费:', event.cost);
}, '0xTokenAddress'); // 可选：按代币地址过滤

// 订阅出售事件
const saleListener = trading.onTokenSale((event) => {
  console.log('代币出售:', event.token);
  console.log('数量:', event.amount);
  console.log('收入:', event.cost);
});

// 取消订阅
trading.off(createListener);
trading.off(purchaseListener);
trading.off(saleListener);
```

#### 查询历史事件

```typescript
// 获取代币创建事件
const createEvents = await trading.getTokenCreateEvents(0, 'latest');

// 获取特定代币的购买事件
const purchaseEvents = await trading.getTokenPurchaseEvents(
  '0xTokenAddress',
  startBlock,
  endBlock
);

// 获取出售事件
const saleEvents = await trading.getTokenSaleEvents('0xTokenAddress');
```

### 🛠️ 实用函数

```typescript
import {
  formatBNB,
  formatTokenAmount,
  parseBNB,
  parseTokenAmount,
  calculatePriceChange,
  isValidAddress,
  normalizeAddress,
  parseTradeEvents,
  getTransactionType,
  calculateGasCost
} from '@fnzero/four-trading-sdk';

// 格式化数量
const bnbFormatted = formatBNB(1000000000000000000n); // "1.0"
const tokenFormatted = formatTokenAmount(1000000000000000000n); // "1.0"

// 解析数量
const bnbWei = parseBNB('1.0'); // 1000000000000000000n
const tokenWei = parseTokenAmount('1.0'); // 1000000000000000000n

// 计算价格变化
const change = calculatePriceChange(100n, 110n); // 10%

// 验证地址
const isValid = isValidAddress('0x...');

// 解析交易事件
const receipt = await provider.getTransactionReceipt(txHash);
const { purchases, sales } = await parseTradeEvents(receipt, contract);

// 获取交易类型
const txType = getTransactionType(tx); // 'buyTokenAMAP' | 'sellToken' 等

// 计算 gas 费用
const gasCost = calculateGasCost(receipt); // "0.001" (BNB)
```

### ⚠️ 错误处理

```typescript
import { ethers } from 'ethers';

try {
  const bnbAmount = ethers.parseEther('0.1');

  const result = await trading.buyToken({
    tokenAddress: '0xTokenAddress',
    fundsInBNB: bnbAmount
  });
  console.log('成功:', result.txHash);
} catch (error) {
  console.error('交易失败:', error.message);
  // 处理错误：余额不足、滑点超限等
}
```

### 💡 重要：金额处理

**所有金额参数必须是 `bigint` 类型：**

```typescript
import { ethers } from 'ethers';

// ✅ 正确 - 使用 ethers 转换金额
const bnbAmount = ethers.parseEther('0.1');           // BNB 金额
const tokenAmount = ethers.parseUnits('1000', 18);    // 代币金额
const gasPrice = ethers.parseUnits('5', 'gwei');      // Gas 价格

// ✅ 正确 - 对简单值使用 bigint 字面量
const gasLimit = 500000n;
const minAmount = 0n;

// ❌ 错误 - 不接受数字和字符串
fundsInBNB: 0.1        // ❌ TypeError
fundsInBNB: '0.1'      // ❌ TypeError
```

**为什么使用 bigint？**
- 防止大数字精度丢失
- 原生区块链金额表示（wei）
- TypeScript 强制类型安全计算
- 不会混淆小数位数

### 📘 TypeScript 支持

SDK 使用 TypeScript 编写，提供完整的类型定义：

```typescript
import {
  FourTrading,
  FourTradingConfig,
  BuyParams,
  SellParams,
  TokenInfo,
  PriceInfo,
  TransactionResult,
  TokenCreateEvent,
  TokenPurchaseEvent,
  TokenSaleEvent
} from '@fnzero/four-trading-sdk';
```

### 📋 合约信息

- **合约地址**: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- **链**: 币安智能链（BSC）
- **链 ID**: 56
- **网络**: 主网
- **区块浏览器**: [BscScan](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)

### 🔧 要求

- Node.js >= 18.0.0
- BSC RPC 端点
- 用于支付 gas 费用的 BNB 私钥

### 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

### 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

### 📞 支持

- GitHub Issues: [报告问题](https://github.com/0xfnzero/four-trading-sdk/issues)
- 文档: [完整 API 文档](https://github.com/0xfnzero/four-trading-sdk#readme)

---

<div align="center">
    <p>Made with ❤️ by the FOUR.meme community</p>
    <p>
        <a href="https://fnzero.dev/">Website</a> •
        <a href="https://t.me/fnzero_group">Telegram</a> •
        <a href="https://discord.gg/vuazbGkqQE">Discord</a> •
        <a href="https://github.com/0xfnzero/four-trading-sdk">GitHub</a> •
        <a href="https://www.npmjs.com/package/@fnzero/four-trading-sdk">NPM</a>
    </p>
</div>
