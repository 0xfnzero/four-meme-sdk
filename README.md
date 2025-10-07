# FOUR Trading SDK

[![npm version](https://img.shields.io/npm/v/four-trading-sdk.svg)](https://www.npmjs.com/package/four-trading-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for trading tokens on the Four.Meme launch platform on Binance Smart Chain (BSC).

## 🚀 Features

- ✅ Buy tokens using BNB
- ✅ Sell tokens for BNB
- ✅ Approve token spending
- ✅ Query BNB and token balances
- ✅ Customizable Gas settings (Gas Price & Gas Limit)
- ✅ Full TypeScript support
- ✅ Easy to integrate

## 📦 Installation

```bash
npm install four-trading-sdk
```

or

```bash
yarn add four-trading-sdk
```

> **Note**: `ethers` is automatically installed as a dependency, no need to install it separately. See [DEPENDENCIES.md](./DEPENDENCIES.md) for details.

## 🔧 Quick Start

### Initialize SDK

```typescript
import { FourTrading } from 'four-trading-sdk';

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed.bnbchain.org',
  privateKey: process.env.PRIVATE_KEY!,
  contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b', // Optional, default is FOUR platform
});
```

### Buy Tokens

```typescript
// Buy tokens with BNB
const buyResult = await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,        // Spend 0.1 BNB (supports number or string)
  minAmount: 0,           // Minimum tokens to receive (slippage protection)
  gas: {                  // Optional: customize gas settings
    gasLimit: 500000,     // Gas limit
    gasPrice: 5,          // Gas price in Gwei
  }
});

console.log('Transaction hash:', buyResult.txHash);
```

### Sell Tokens

```typescript
// Step 1: Approve contract to spend tokens (only needed once per token)
await trading.approveToken(
  '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  undefined,  // Amount (undefined = max approval)
  {           // Optional: gas settings
    gasLimit: 100000,
    gasPrice: 5,
  }
);

// Step 2: Sell tokens
const sellResult = await trading.sellToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  amount: 1000,           // Amount of tokens to sell (supports number or string)
  bonusAmount: 0,         // Bonus amount (usually 0)
  gas: {                  // Optional: customize gas settings
    gasLimit: 500000,
    gasPrice: 5,
  }
});

console.log('Transaction hash:', sellResult.txHash);
```

### Check Balances

```typescript
// Get BNB balance
const bnbBalance = await trading.getBNBBalance();
console.log('BNB Balance:', bnbBalance);

// Get token balance
const tokenBalance = await trading.getTokenBalance('0x6d97e28527582d1be954fde04e83c8e4bbd44444');
console.log('Token Balance:', tokenBalance);

// Get wallet address
console.log('Wallet:', trading.getWalletAddress());
```

## ⚙️ Gas Configuration

All trading methods (`buyToken`, `sellToken`, `approveToken`) support optional gas configuration:

```typescript
gas: {
  gasLimit?: number | string;           // Gas limit
  gasPrice?: number | string;           // Gas price in Gwei (legacy mode)
  maxFeePerGas?: number | string;       // Max fee per gas in Gwei (EIP-1559)
  maxPriorityFeePerGas?: number | string; // Priority fee in Gwei (EIP-1559)
}
```

**Example:**
```typescript
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  gas: {
    gasLimit: 500000,
    gasPrice: 5,  // 5 Gwei
  }
});
```

**📚 For detailed gas configuration guide, see [GAS_CONFIGURATION.md](./GAS_CONFIGURATION.md)**

## 📖 API Reference

### Constructor

```typescript
new FourTrading(config: FourTradingConfig)
```

**FourTradingConfig:**
- `rpcUrl`: BSC RPC endpoint URL
- `privateKey`: Your wallet private key
- `contractAddress`: (Optional) FOUR platform contract address

### Methods

#### `buyToken(params: BuyParams)`

Buy tokens using BNB.

**Parameters:**
```typescript
{
  tokenAddress: string;        // Token contract address
  fundsInBNB: number | string; // Amount of BNB to spend
  minAmount?: number | string; // Minimum tokens to receive (optional)
  gas?: GasOptions;            // Gas configuration (optional)
}
```

**Returns:** `Promise<{ success: boolean; txHash: string; receipt: any }>`

#### `sellToken(params: SellParams)`

Sell tokens for BNB.

**Parameters:**
```typescript
{
  tokenAddress: string;          // Token contract address
  amount: number | string;       // Amount of tokens to sell
  bonusAmount?: number | string; // Bonus amount (optional, usually 0)
  gas?: GasOptions;              // Gas configuration (optional)
}
```

**Returns:** `Promise<{ success: boolean; txHash: string; receipt: any }>`

#### `approveToken(tokenAddress: string, amount?: number | string, gas?: GasOptions)`

Approve the contract to spend tokens. Must be called before selling.

**Parameters:**
- `tokenAddress`: Token contract address
- `amount`: (Optional) Amount to approve, defaults to max (unlimited)
- `gas`: (Optional) Gas configuration

**Returns:** `Promise<{ success: boolean; txHash: string; receipt: any }>`

#### `getBNBBalance()`

Get wallet's BNB balance.

**Returns:** `Promise<string>` - Balance in BNB

#### `getTokenBalance(tokenAddress: string)`

Get wallet's token balance.

**Parameters:**
- `tokenAddress`: Token contract address

**Returns:** `Promise<string>` - Token balance

#### `getWalletAddress()`

Get the wallet address being used.

**Returns:** `string` - Wallet address

## 💡 Complete Example

```typescript
import { FourTrading } from 'four-trading-sdk';

async function main() {
  // Initialize SDK
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed.bnbchain.org',
    privateKey: process.env.PRIVATE_KEY!,
  });

  console.log('Wallet:', trading.getWalletAddress());
  console.log('BNB Balance:', await trading.getBNBBalance());

  const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  // Buy tokens
  try {
    const buyResult = await trading.buyToken({
      tokenAddress,
      fundsInBNB: 0.1,
      minAmount: 0,
    });
    console.log('✅ Buy successful:', buyResult.txHash);
  } catch (error) {
    console.error('❌ Buy failed:', error);
  }

  // Approve and sell tokens
  try {
    await trading.approveToken(tokenAddress);
    console.log('✅ Approved');

    const sellResult = await trading.sellToken({
      tokenAddress,
      amount: 1000,
      bonusAmount: 0,
    });
    console.log('✅ Sell successful:', sellResult.txHash);
  } catch (error) {
    console.error('❌ Sell failed:', error);
  }
}

main().catch(console.error);
```

## 🌐 RPC Endpoints

### BSC Mainnet (Recommended)
- `https://bsc-dataseed.bnbchain.org` (Official, recommended)
- `https://bsc-dataseed1.bnbchain.org`
- `https://bsc-dataseed2.bnbchain.org`
- `https://bsc-dataseed3.bnbchain.org`
- `https://bsc-dataseed4.bnbchain.org`

### BSC Testnet
- `https://data-seed-prebsc-1-s1.binance.org:8545/`

> **Note**: You can use any BSC-compatible RPC endpoint by passing your custom URL to the `rpcUrl` parameter.

## 🔒 Security

⚠️ **Important Security Notes:**

1. **Never commit your private key** to version control
2. Use environment variables: `process.env.PRIVATE_KEY`
3. Test on BSC testnet first before using mainnet
4. Always verify token addresses before trading
5. Use `minAmount` parameter for slippage protection when buying

## 📝 Contract Information

- **Platform Contract**: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- **Chain**: Binance Smart Chain (BSC)
- **Native Currency**: BNB

### Contract Methods

**Buy Method**: `buyTokenAMAP(address token, uint256 funds, uint256 minAmount)`
- Method ID: `0x87f27655`

**Sell Method**: `sellToken(address to_, uint256 amount, uint256 bonusAmount)`
- Method ID: `0x3e11741f`

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
# four-meme-sdk
