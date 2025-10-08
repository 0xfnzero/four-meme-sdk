# FOUR Trading SDK

[![npm version](https://img.shields.io/npm/v/four-trading-sdk.svg)](https://www.npmjs.com/package/four-trading-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Comprehensive TypeScript SDK for interacting with the Four.Meme token launch platform on Binance Smart Chain (BSC).

## 🚀 Features

### Trading Operations
- ✅ Buy tokens using BNB (AMAP - As Much As Possible)
- ✅ Buy exact amount of tokens with maximum funds limit
- ✅ Sell tokens for BNB with multiple options
- ✅ Create new tokens on the platform
- ✅ Add liquidity to tokens
- ✅ Approve token spending

### Query Functions
- ✅ Get comprehensive token information (TokenInfo & TokenInfoEx)
- ✅ Get platform templates and configurations
- ✅ Query all platform tokens by index
- ✅ Get trading fees, launch fees, and other platform parameters
- ✅ Calculate buy/sell costs and amounts
- ✅ Get token and BNB balances

### Event Subscriptions
- ✅ Real-time event listeners for TokenCreate, TokenPurchase, TokenSale, and LiquidityAdded
- ✅ Historical event queries with block range filtering
- ✅ Event filtering by token address
- ✅ Manage and clean up event listeners

### Other Features
- ✅ Customizable Gas settings (Gas Price & Gas Limit, EIP-1559 support)
- ✅ Full TypeScript support with comprehensive type definitions
- ✅ Easy to integrate

## 📦 Installation

```bash
npm install four-trading-sdk
```

or

```bash
yarn add four-trading-sdk
```

> **Note**: `ethers` is automatically installed as a dependency.

## 🔧 Quick Start

### Initialize SDK

```typescript
import { FourTrading } from 'four-trading-sdk';

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.bnbchain.org',
  privateKey: process.env.PRIVATE_KEY!,
  contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b', // Optional
});
```

### Buy Tokens

```typescript
// Buy tokens with BNB (AMAP - as much as possible)
const buyResult = await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,        // Spend 0.1 BNB
  minAmount: 0,           // Minimum tokens to receive (slippage protection)
  to: '0x...',            // Optional: recipient address (defaults to sender)
  gas: {                  // Optional: customize gas settings
    gasLimit: 500000,
    gasPrice: 5,          // Gas price in Gwei
  }
});

// Or buy exact amount of tokens
const exactBuyResult = await trading.buyTokenExact(
  '0x6d97e28527582d1be954fde04e83c8e4bbd44444',  // Token address
  1000,                                           // Exact amount to buy
  0.2,                                            // Max BNB to spend
  undefined,                                      // Optional recipient
  { gasLimit: 500000, gasPrice: 5 }              // Optional gas config
);
```

### Sell Tokens

```typescript
// Step 1: Approve contract to spend tokens (only needed once per token)
await trading.approveToken(
  '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  undefined,  // Amount (undefined = max approval)
  { gasLimit: 100000, gasPrice: 5 }
);

// Step 2: Sell tokens
const sellResult = await trading.sellToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  amount: 1000,           // Amount of tokens to sell
  minFunds: 0.01,         // Minimum BNB to receive (slippage protection)
  origin: 0,              // Origin identifier (optional)
  feeRate: 100,           // Custom fee rate (optional)
  feeRecipient: '0x...',  // Custom fee recipient (optional)
  gas: {
    gasLimit: 500000,
    gasPrice: 5,
  }
});
```

### Query Token Information

```typescript
// Get comprehensive token information
const tokenInfo = await trading.getTokenInfo('0x6d97e28527582d1be954fde04e83c8e4bbd44444');
console.log('Token status:', tokenInfo.status);
console.log('Current price:', ethers.formatUnits(tokenInfo.lastPrice, 18));
console.log('Total funds raised:', ethers.formatEther(tokenInfo.funds), 'BNB');

// Get extended token information
const tokenInfoEx = await trading.getTokenInfoEx('0x6d97e28527582d1be954fde04e83c8e4bbd44444');
console.log('Creator:', tokenInfoEx.creator);
console.log('Reserves:', ethers.formatUnits(tokenInfoEx.reserves, 18));

// Calculate pricing
const buyAmount = await trading.calcBuyAmount(tokenInfo, ethers.parseEther('0.1'));
console.log('For 0.1 BNB, you get:', ethers.formatUnits(buyAmount, 18), 'tokens');

const buyCost = await trading.calcBuyCost(tokenInfo, ethers.parseUnits('1000', 18));
console.log('1000 tokens cost:', ethers.formatEther(buyCost), 'BNB');
```

### Event Subscriptions

```typescript
import { ethers } from 'ethers';

// Listen to new token creations
const listenerId = trading.onTokenCreate((event) => {
  console.log('New token created!');
  console.log('Token:', event.token);
  console.log('Name:', event.name);
  console.log('Symbol:', event.symbol);
  console.log('Creator:', event.creator);
});

// Listen to token purchases for a specific token
const purchaseListenerId = trading.onTokenPurchase((event) => {
  console.log('Token purchase detected!');
  console.log('Buyer:', event.account);
  console.log('Amount:', ethers.formatUnits(event.amount, 18));
  console.log('Cost:', ethers.formatEther(event.cost), 'BNB');
}, '0x6d97e28527582d1be954fde04e83c8e4bbd44444'); // Optional: filter by token

// Listen to token sales
const saleListenerId = trading.onTokenSale((event) => {
  console.log('Token sale detected!');
  console.log('Seller:', event.account);
  console.log('Amount:', ethers.formatUnits(event.amount, 18));
  console.log('Received:', ethers.formatEther(event.cost), 'BNB');
}, '0x6d97e28527582d1be954fde04e83c8e4bbd44444');

// Listen to liquidity additions
const liquidityListenerId = trading.onLiquidityAdded((event) => {
  console.log('Liquidity added!');
  console.log('Token:', event.base);
  console.log('Funds:', ethers.formatEther(event.funds), 'BNB');
});

// Unsubscribe from specific event
trading.off(listenerId);

// Or remove all listeners
trading.removeAllListeners();
```

### Query Historical Events

```typescript
// Get recent token creations
const tokenCreateEvents = await trading.getTokenCreateEvents(
  startBlock,  // From block number (default: 0)
  'latest'     // To block number or 'latest' (default: 'latest')
);

console.log('Recent token creations:', tokenCreateEvents.length);
tokenCreateEvents.forEach(event => {
  console.log(`${event.name} (${event.symbol}) - ${event.token}`);
});

// Get recent purchases for specific token
const purchaseEvents = await trading.getTokenPurchaseEvents(
  '0x6d97e28527582d1be954fde04e83c8e4bbd44444',  // Optional: filter by token
  startBlock,
  'latest'
);

// Get recent sales for specific token
const saleEvents = await trading.getTokenSaleEvents(
  '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  startBlock,
  'latest'
);
```

### Query Platform Information

```typescript
// Get platform statistics
const tokenCount = await trading.getTokenCount();
const templateCount = await trading.getTemplateCount();
const tradingFeeRate = await trading.getTradingFeeRate();
const launchFee = await trading.getLaunchFee();
const feeRecipient = await trading.getFeeRecipient();
const isHalted = await trading.isTradingHalted();

// Get status constants
const statuses = await trading.getStatusConstants();
console.log('Status codes:', {
  TRADING: statuses.TRADING,
  ADDING_LIQUIDITY: statuses.ADDING_LIQUIDITY,
  COMPLETED: statuses.COMPLETED,
  HALT: statuses.HALT,
});

// Get template information
const template = await trading.getTemplate(0);
console.log('Quote token:', template.quote);
console.log('Initial liquidity:', ethers.formatEther(template.initialLiquidity));

// Get token by index
const tokenAddress = await trading.getTokenByIndex(0);
```

## ⚙️ Gas Configuration

All transaction methods support optional gas configuration:

```typescript
gas: {
  gasLimit?: number | string;           // Gas limit
  gasPrice?: number | string;           // Gas price in Gwei (legacy mode)
  maxFeePerGas?: number | string;       // Max fee per gas in Gwei (EIP-1559)
  maxPriorityFeePerGas?: number | string; // Priority fee in Gwei (EIP-1559)
}
```

**Examples:**

```typescript
// Legacy gas pricing
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  gas: {
    gasLimit: 500000,
    gasPrice: 5,  // 5 Gwei
  }
});

// EIP-1559 gas pricing
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  gas: {
    gasLimit: 500000,
    maxFeePerGas: 10,
    maxPriorityFeePerGas: 2,
  }
});
```

## 📖 API Reference

### Class: `FourTrading`

#### Constructor
```typescript
new FourTrading(config: FourTradingConfig)
```

**FourTradingConfig:**
- `rpcUrl`: BSC RPC endpoint URL
- `privateKey`: Your wallet private key
- `contractAddress`: (Optional) FOUR platform contract address

#### Trading Methods

##### `buyToken(params: BuyParams)`
Buy tokens using BNB (AMAP mode).

**Parameters:**
```typescript
{
  tokenAddress: string;
  fundsInBNB: number | string;
  minAmount?: number | string;
  to?: string;  // Optional recipient
  gas?: GasOptions;
}
```

##### `buyTokenExact(tokenAddress, amount, maxFunds, to?, gas?)`
Buy exact amount of tokens with maximum funds limit.

##### `sellToken(params: SellParams)`
Sell tokens for BNB.

**Parameters:**
```typescript
{
  tokenAddress: string;
  amount: number | string;
  minFunds?: number | string;
  origin?: number;
  feeRate?: number | string;
  feeRecipient?: string;
  gas?: GasOptions;
}
```

##### `createToken(params: CreateTokenParams)`
Create a new token on the platform.

##### `addLiquidity(tokenAddress, gas?)`
Add liquidity to a token (admin function).

##### `approveToken(tokenAddress, amount?, gas?)`
Approve the contract to spend tokens.

#### Query Methods

##### `getTokenInfo(tokenAddress): Promise<TokenInfo>`
Get comprehensive token information.

##### `getTokenInfoEx(tokenAddress): Promise<TokenInfoEx>`
Get extended token information (creator, founder, reserves).

##### `getTemplate(templateId): Promise<Template>`
Get template configuration.

##### `getTokenByIndex(index): Promise<string>`
Get token address by index.

##### `getTokenCount(): Promise<bigint>`
Get total number of tokens on the platform.

##### `getTemplateCount(): Promise<bigint>`
Get total number of templates.

##### `getTradingFeeRate(): Promise<bigint>`
Get current trading fee rate.

##### `getLaunchFee(): Promise<bigint>`
Get token launch fee.

##### `getFeeRecipient(): Promise<string>`
Get fee recipient address.

##### `getReferralRewardRate(): Promise<bigint>`
Get referral reward rate.

##### `isTradingHalted(): Promise<boolean>`
Check if trading is halted.

##### `getOwner(): Promise<string>`
Get contract owner address.

##### `getSigner(): Promise<string>`
Get signer address.

##### `getStatusConstants(): Promise<StatusConstants>`
Get all status constants (TRADING, ADDING_LIQUIDITY, COMPLETED, HALT).

##### Calculation Methods

- `calcBuyAmount(tokenInfo, funds): Promise<bigint>` - Calculate tokens received for given BNB
- `calcBuyCost(tokenInfo, amount): Promise<bigint>` - Calculate BNB cost for given token amount
- `calcSellCost(tokenInfo, amount): Promise<bigint>` - Calculate BNB received for selling tokens
- `calcTradingFee(tokenInfo, funds): Promise<bigint>` - Calculate trading fee
- `calcLastPrice(tokenInfo): Promise<bigint>` - Calculate last price

##### Balance Methods

- `getBNBBalance(): Promise<string>` - Get wallet's BNB balance
- `getTokenBalance(tokenAddress): Promise<string>` - Get wallet's token balance
- `getWalletAddress(): string` - Get wallet address

#### Event Subscription Methods

##### `onTokenCreate(listener): string`
Subscribe to TokenCreate events. Returns listener ID.

##### `onTokenPurchase(listener, tokenAddress?): string`
Subscribe to TokenPurchase events. Optionally filter by token address.

##### `onTokenSale(listener, tokenAddress?): string`
Subscribe to TokenSale events. Optionally filter by token address.

##### `onLiquidityAdded(listener): string`
Subscribe to LiquidityAdded events.

##### `off(listenerId): void`
Unsubscribe from a specific event.

##### `removeAllListeners(): void`
Remove all event listeners.

#### Historical Event Query Methods

- `getTokenCreateEvents(fromBlock?, toBlock?): Promise<TokenCreateEvent[]>`
- `getTokenPurchaseEvents(tokenAddress?, fromBlock?, toBlock?): Promise<TokenPurchaseEvent[]>`
- `getTokenSaleEvents(tokenAddress?, fromBlock?, toBlock?): Promise<TokenSaleEvent[]>`

## 💡 Complete Example

See [examples/fourTradingExample.ts](./examples/fourTradingExample.ts) for a comprehensive example demonstrating all features.

## 🌐 RPC Endpoints

### BSC Mainnet (Recommended)
- `https://bsc-dataseed.bnbchain.org` (Official, recommended)
- `https://bsc-dataseed1.bnbchain.org`
- `https://bsc-dataseed2.bnbchain.org`
- `https://bsc-dataseed3.bnbchain.org`
- `https://bsc-dataseed4.bnbchain.org`

### BSC Testnet
- `https://data-seed-prebsc-1-s1.binance.org:8545/`

## 🔒 Security

⚠️ **Important Security Notes:**

1. **Never commit your private key** to version control
2. Use environment variables: `process.env.PRIVATE_KEY`
3. Test on BSC testnet first before using mainnet
4. Always verify token addresses before trading
5. Use `minAmount` and `minFunds` parameters for slippage protection

## 📝 Contract Information

- **Platform Contract**: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- **Chain**: Binance Smart Chain (BSC)
- **Native Currency**: BNB

### Key Contract Methods

**Buy Method**: `buyTokenAMAP(address token, uint256 funds, uint256 minAmount)`
**Sell Method**: `sellToken(address token, uint256 amount, uint256 minFunds)`
**Create Token**: `createToken(bytes args, bytes signature)`

## 🛠️ Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run build:watch
```

### Run Example

```bash
npm run example
```

## 📄 License

MIT

## 🔗 Links

- [BSCScan - Contract](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [BSC Documentation](https://docs.bnbchain.org/)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!
