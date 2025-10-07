# FOUR Launch Platform Trading SDK (BSC)

TypeScript SDK for trading tokens on the FOUR launch platform on Binance Smart Chain (BSC).

## Contract Information

- **Contract Address**: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- **Chain**: BSC (Binance Smart Chain)
- **Native Currency**: BNB

## Methods Implemented

### 1. Buy Tokens - `buyTokenAMAP`
- **Method ID**: `0x87f27655`
- **Parameters**:
  - `token` (address): Token contract address
  - `funds` (uint256): Amount of BNB to spend (in wei)
  - `minAmount` (uint256): Minimum tokens to receive (slippage protection)

### 2. Sell Tokens - `sellToken`
- **Method ID**: `0x3e11741f`
- **Parameters**:
  - `to_` (address): Recipient address (token address)
  - `amount` (uint256): Amount of tokens to sell
  - `bonusAmount` (uint256): Bonus amount (usually 0)

## Installation

```bash
npm install ethers
# or
yarn add ethers
```

## Usage

### Basic Setup

```typescript
import { FourTrading, FourTradingConfig } from './src/fourTrading';

const config: FourTradingConfig = {
  rpcUrl: 'https://bsc-dataseed1.binance.org/',
  privateKey: 'YOUR_PRIVATE_KEY',
  contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
};

const trading = new FourTrading(config);
```

### Buy Tokens

```typescript
const buyParams = {
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: '0.1', // Spend 0.1 BNB
  minAmount: '0', // Minimum tokens to receive
};

const result = await trading.buyToken(buyParams);
console.log('Transaction hash:', result.txHash);
```

### Sell Tokens

**Important**: Before selling, you must approve the contract to spend your tokens.

```typescript
// Step 1: Approve (only needed once per token)
await trading.approveToken(tokenAddress);

// Step 2: Sell
const sellParams = {
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  amount: '1000', // Amount of tokens to sell
  bonusAmount: '0',
};

const result = await trading.sellToken(sellParams);
console.log('Transaction hash:', result.txHash);
```

### Check Balances

```typescript
// Get BNB balance
const bnbBalance = await trading.getBNBBalance();
console.log('BNB:', bnbBalance);

// Get token balance
const tokenBalance = await trading.getTokenBalance(tokenAddress);
console.log('Tokens:', tokenBalance);
```

## API Reference

### Class: `FourTrading`

#### Constructor
```typescript
constructor(config: FourTradingConfig)
```

#### Methods

##### `buyToken(params: BuyParams)`
Buy tokens using BNB.

**Parameters:**
- `params.tokenAddress` - Token contract address
- `params.fundsInBNB` - Amount of BNB to spend (string, in BNB units)
- `params.minAmount` - Minimum tokens to receive (optional, for slippage protection)

**Returns:** Transaction result with hash and receipt

##### `sellToken(params: SellParams)`
Sell tokens for BNB.

**Parameters:**
- `params.tokenAddress` - Token contract address
- `params.amount` - Amount of tokens to sell (string)
- `params.bonusAmount` - Bonus amount (optional, usually '0')

**Returns:** Transaction result with hash and receipt

##### `approveToken(tokenAddress: string, amount?: string)`
Approve the contract to spend tokens (required before selling).

**Parameters:**
- `tokenAddress` - Token contract address
- `amount` - Amount to approve (optional, defaults to max)

**Returns:** Transaction result with hash and receipt

##### `getBNBBalance()`
Get wallet's BNB balance.

**Returns:** Balance as string (in BNB units)

##### `getTokenBalance(tokenAddress: string)`
Get wallet's token balance.

**Parameters:**
- `tokenAddress` - Token contract address

**Returns:** Balance as string

##### `getWalletAddress()`
Get the wallet address being used.

**Returns:** Wallet address as string

## Example Transaction Data

### Buy Transaction Example
```
Function: buyTokenAMAP(address token,uint256 funds,uint256 minAmount)
MethodID: 0x87f27655
[0]: 0000000000000000000000006d97e28527582d1be954fde04e83c8e4bbd44444
[1]: 0000000000000000000000000000000000000000000000001bc16d674ec80000  // 2 BNB in wei
[2]: 0000000000000000000000000000000000000000000000000000000000000000  // minAmount = 0
```

### Sell Transaction Example
```
Function: sellToken(address to_, uint256 amount, uint256 bonusAmount)
MethodID: 0x3e11741f
[0]: 000000000000000000000000d81d45708d16b45b954b15352c2b73ec6df64444
[1]: 00000000000000000000000000000000000000000052f6cf97eaa5be8b268a00
[2]: 0000000000000000000000000000000000000000000000000000000000000000  // bonusAmount = 0
```

## RPC Endpoints

### BSC Mainnet
- `https://bsc-dataseed1.binance.org/`
- `https://bsc-dataseed2.binance.org/`
- `https://bsc-dataseed3.binance.org/`

### BSC Testnet
- `https://data-seed-prebsc-1-s1.binance.org:8545/`

## Security Notes

1. **Never commit your private key** to version control
2. Use environment variables: `process.env.PRIVATE_KEY`
3. Test on BSC testnet first before using mainnet
4. Always verify token addresses before trading
5. Use `minAmount` parameter for slippage protection when buying

## Error Handling

```typescript
try {
  const result = await trading.buyToken(params);
  console.log('Success:', result.txHash);
} catch (error) {
  console.error('Transaction failed:', error.message);
  // Handle error (insufficient balance, slippage, etc.)
}
```

## Gas Settings

Default gas limit is set to 500,000. Adjust if needed:

```typescript
// In the buy/sell methods, modify the gasLimit parameter
{
  gasLimit: 500000, // Adjust as needed
}
```

## Links

- [BSCScan](https://bscscan.com/address/0x5c952063c7fc8610FFDB798152D69F0B9550762b)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [BSC Documentation](https://docs.bnbchain.org/)
