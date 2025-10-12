<div align="center">
    <h1>🚀 FOUR.meme Trading SDK</h1>
    <h3><em>A comprehensive TypeScript SDK for seamless FOUR.meme token trading on BSC</em></h3>
</div>

<p align="center">
    <strong>Integrate FOUR.meme token trading, price calculation, and event monitoring into your applications with powerful tools and unified interfaces.</strong>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/four-trading-sdk">
        <img src="https://img.shields.io/npm/v/four-trading-sdk.svg" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/four-trading-sdk">
        <img src="https://img.shields.io/npm/dm/four-trading-sdk.svg" alt="npm downloads">
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
    <a href="https://four.meme">Website</a>
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
npm install four-trading-sdk
```

or

```bash
yarn add four-trading-sdk
```

or

```bash
pnpm add four-trading-sdk
```

### 🚀 Quick Start

```typescript
import { FourTrading } from 'four-trading-sdk';

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',
  privateKey: 'your-private-key'
});

// Get price quote
const quote = await trading.quoteBuy('0xTokenAddress', 0.1);
console.log(`Estimated tokens: ${quote.tokenAmount}`);

// Buy tokens with slippage protection
const result = await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: 0.1,
  minAmount: quote.tokenAmount * 99n / 100n // 1% slippage
});

console.log(`Transaction successful: ${result.txHash}`);
```

### 💡 Core Functions

#### Initialize SDK

```typescript
import { FourTrading } from 'four-trading-sdk';

// HTTP Provider
const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',
  privateKey: 'your-private-key'
});

// WebSocket Provider (for real-time events)
const trading = new FourTrading({
  rpcUrl: 'wss://bsc-rpc.publicnode.com',
  privateKey: 'your-private-key'
});
```

#### Buy Tokens

```typescript
// Method 1: Buy with BNB amount (recommended)
await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: 0.1,        // Amount of BNB to spend
  minAmount: '1000',       // Minimum tokens to receive (slippage protection)
  to: '0xRecipient'        // Optional: recipient address
});

// Method 2: Buy exact token amount
await trading.buyTokenExact(
  '0xTokenAddress',
  '1000',                  // Exact token amount
  0.2,                     // Maximum BNB to spend
  '0xRecipient'            // Optional: recipient address
);
```

#### Sell Tokens

```typescript
// First, approve token spending
await trading.approveToken('0xTokenAddress');

// Then sell tokens
await trading.sellToken({
  tokenAddress: '0xTokenAddress',
  amount: '1000',          // Amount of tokens to sell
  minFunds: '0.1'          // Minimum BNB to receive (slippage protection)
});
```

#### Price Queries

```typescript
// Get buy quote
const buyQuote = await trading.quoteBuy('0xTokenAddress', 0.1);
console.log(`Tokens: ${buyQuote.tokenAmount}`);
console.log(`Fee: ${buyQuote.fee}`);
console.log(`Price per token: ${buyQuote.pricePerToken}`);

// Get sell quote
const sellQuote = await trading.quoteSell('0xTokenAddress', '1000');
console.log(`BNB received: ${sellQuote.bnbCost}`);
console.log(`Fee: ${sellQuote.fee}`);

// Get current price
const currentPrice = await trading.getCurrentPrice('0xTokenAddress');
console.log(`Current price: ${currentPrice} BNB`);

// Calculate with slippage protection
const buyWithSlippage = await trading.calculateBuyWithSlippage(
  '0xTokenAddress',
  0.1,                     // BNB amount
  1                        // 1% slippage
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
} from 'four-trading-sdk';

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
try {
  const result = await trading.buyToken({
    tokenAddress: '0xTokenAddress',
    fundsInBNB: 0.1
  });
  console.log('Success:', result.txHash);
} catch (error) {
  console.error('Transaction failed:', error.message);
  // Handle error: insufficient balance, slippage exceeded, etc.
}
```

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
} from 'four-trading-sdk';
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
npm install four-trading-sdk
```

或

```bash
yarn add four-trading-sdk
```

或

```bash
pnpm add four-trading-sdk
```

### 🚀 快速开始

```typescript
import { FourTrading } from 'four-trading-sdk';

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',
  privateKey: '你的私钥'
});

// 获取价格报价
const quote = await trading.quoteBuy('0xTokenAddress', 0.1);
console.log(`预计获得代币数量: ${quote.tokenAmount}`);

// 使用滑点保护买入代币
const result = await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: 0.1,
  minAmount: quote.tokenAmount * 99n / 100n // 1% 滑点
});

console.log(`交易成功: ${result.txHash}`);
```

### 💡 核心功能

#### 初始化 SDK

```typescript
import { FourTrading } from 'four-trading-sdk';

// HTTP 提供者
const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.binance.org',
  privateKey: '你的私钥'
});

// WebSocket 提供者（用于实时事件）
const trading = new FourTrading({
  rpcUrl: 'wss://bsc-rpc.publicnode.com',
  privateKey: '你的私钥'
});
```

#### 买入代币

```typescript
// 方法 1：使用 BNB 金额买入（推荐）
await trading.buyToken({
  tokenAddress: '0xTokenAddress',
  fundsInBNB: 0.1,        // 要花费的 BNB 数量
  minAmount: '1000',       // 最少接收的代币数量（滑点保护）
  to: '0xRecipient'        // 可选：接收地址
});

// 方法 2：买入精确数量的代币
await trading.buyTokenExact(
  '0xTokenAddress',
  '1000',                  // 精确的代币数量
  0.2,                     // 最多花费的 BNB
  '0xRecipient'            // 可选：接收地址
);
```

#### 卖出代币

```typescript
// 首先，授权代币使用
await trading.approveToken('0xTokenAddress');

// 然后卖出代币
await trading.sellToken({
  tokenAddress: '0xTokenAddress',
  amount: '1000',          // 要卖出的代币数量
  minFunds: '0.1'          // 最少接收的 BNB（滑点保护）
});
```

#### 价格查询

```typescript
// 获取买入报价
const buyQuote = await trading.quoteBuy('0xTokenAddress', 0.1);
console.log(`代币数量: ${buyQuote.tokenAmount}`);
console.log(`手续费: ${buyQuote.fee}`);
console.log(`每个代币价格: ${buyQuote.pricePerToken}`);

// 获取卖出报价
const sellQuote = await trading.quoteSell('0xTokenAddress', '1000');
console.log(`获得 BNB: ${sellQuote.bnbCost}`);
console.log(`手续费: ${sellQuote.fee}`);

// 获取当前价格
const currentPrice = await trading.getCurrentPrice('0xTokenAddress');
console.log(`当前价格: ${currentPrice} BNB`);

// 使用滑点保护计算
const buyWithSlippage = await trading.calculateBuyWithSlippage(
  '0xTokenAddress',
  0.1,                     // BNB 数量
  1                        // 1% 滑点
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
} from 'four-trading-sdk';

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
try {
  const result = await trading.buyToken({
    tokenAddress: '0xTokenAddress',
    fundsInBNB: 0.1
  });
  console.log('成功:', result.txHash);
} catch (error) {
  console.error('交易失败:', error.message);
  // 处理错误：余额不足、滑点超限等
}
```

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
} from 'four-trading-sdk';
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
        <a href="https://four.meme">Website</a> •
        <a href="https://github.com/0xfnzero/four-trading-sdk">GitHub</a> •
        <a href="https://www.npmjs.com/package/four-trading-sdk">NPM</a>
    </p>
</div>
