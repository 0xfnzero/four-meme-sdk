# Gas 配置指南

## 概述

FOUR Trading SDK 支持用户自定义 Gas 配置，让你完全控制交易的 Gas 费用。

## Gas 选项接口

```typescript
interface GasOptions {
  gasLimit?: number | string;           // Gas limit
  gasPrice?: number | string;           // Gas price (Gwei) - 传统模式
  maxFeePerGas?: number | string;       // 最大 gas 费用 (Gwei) - EIP-1559
  maxPriorityFeePerGas?: number | string; // 优先费用 (Gwei) - EIP-1559
}
```

## 使用方式

### 1. 买入代币时设置 Gas

```typescript
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 500000,    // Gas limit
    gasPrice: 5,         // 5 Gwei
  }
});
```

### 2. 卖出代币时设置 Gas

```typescript
await trading.sellToken({
  tokenAddress: '0x...',
  amount: 1000,
  bonusAmount: 0,
  gas: {
    gasLimit: 500000,
    gasPrice: 5,
  }
});
```

### 3. 授权时设置 Gas

```typescript
await trading.approveToken(
  '0x...', // tokenAddress
  undefined, // amount (undefined = max approval)
  {
    gasLimit: 100000,
    gasPrice: 5,
  }
);
```

## Gas 定价模式

### 传统模式 (Legacy)

使用固定的 `gasPrice`：

```typescript
gas: {
  gasLimit: 500000,
  gasPrice: 5,  // 5 Gwei
}
```

**适用场景**：
- BSC 等不支持 EIP-1559 的链
- 想要简单固定的 gas 价格

### EIP-1559 模式

使用动态的 `maxFeePerGas` 和 `maxPriorityFeePerGas`：

```typescript
gas: {
  gasLimit: 500000,
  maxFeePerGas: 10,           // 愿意支付的最大费用
  maxPriorityFeePerGas: 2,    // 给矿工的小费
}
```

**适用场景**：
- 以太坊主网等支持 EIP-1559 的链
- 希望在网络拥堵时优先打包

⚠️ **注意**：不要同时使用 `gasPrice` 和 `maxFeePerGas`，选择其中一种模式。

## 单位说明

- **gasLimit**: 整数，表示允许消耗的最大 gas 数量
- **gasPrice**: Gwei 为单位（1 Gwei = 0.000000001 BNB）
- **maxFeePerGas**: Gwei 为单位
- **maxPriorityFeePerGas**: Gwei 为单位

### 示例转换

```
1 Gwei = 0.000000001 BNB
5 Gwei = 0.000000005 BNB
10 Gwei = 0.00000001 BNB
```

如果 gasLimit = 500000，gasPrice = 5 Gwei：
```
总 Gas 费用 = 500000 × 5 Gwei = 2,500,000 Gwei = 0.0025 BNB
```

## 默认行为

如果不提供 gas 参数，SDK 将使用以下默认行为：

- **gasLimit**: 由 ethers.js 自动估算
- **gasPrice**: 使用网络当前 gas 价格

```typescript
// 不指定 gas，使用默认值
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  minAmount: 0,
  // 不提供 gas 参数
});
```

## 推荐配置

### BSC 主网

```typescript
gas: {
  gasLimit: 500000,     // 大部分交易足够
  gasPrice: 5,          // 5 Gwei 通常足够快
}
```

### BSC 测试网

```typescript
gas: {
  gasLimit: 500000,
  gasPrice: 10,         // 测试网可以用稍高的 gas
}
```

### 快速交易（优先打包）

```typescript
gas: {
  gasLimit: 600000,     // 稍高的 limit
  gasPrice: 10,         // 更高的 price
}
```

### 节省费用（不急）

```typescript
gas: {
  gasLimit: 400000,     // 尽可能低（但要够用）
  gasPrice: 3,          // 较低的 price
}
```

## 查询当前 Gas 价格

你可以先查询当前网络的 gas 价格再决定：

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');

// 获取当前 gas price
const feeData = await provider.getFeeData();
console.log('Gas Price:', ethers.formatUnits(feeData.gasPrice!, 'gwei'), 'Gwei');

if (feeData.maxFeePerGas) {
  console.log('Max Fee:', ethers.formatUnits(feeData.maxFeePerGas, 'gwei'), 'Gwei');
  console.log('Priority Fee:', ethers.formatUnits(feeData.maxPriorityFeePerGas!, 'gwei'), 'Gwei');
}
```

## 实际示例

### 示例 1：简单买入（使用默认 Gas）

```typescript
// 不指定 gas，让 SDK 自动处理
await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
});
```

### 示例 2：自定义 Gas 买入

```typescript
await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 500000,
    gasPrice: 5,  // 5 Gwei
  }
});
```

### 示例 3：高优先级买入（抢跑）

```typescript
await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 600000,
    gasPrice: 20,  // 高 gas price 优先打包
  }
});
```

### 示例 4：动态 Gas（根据网络情况）

```typescript
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
const feeData = await provider.getFeeData();

// 使用当前网络 gas price 的 1.2 倍
const currentGasPrice = ethers.formatUnits(feeData.gasPrice!, 'gwei');
const myGasPrice = parseFloat(currentGasPrice) * 1.2;

await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 500000,
    gasPrice: myGasPrice,
  }
});
```

### 示例 5：完整的买卖流程

```typescript
const gasConfig = {
  gasLimit: 500000,
  gasPrice: 5,
};

// 买入
const buyResult = await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: gasConfig,
});

// 授权
await trading.approveToken(
  '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  undefined,
  {
    gasLimit: 100000,
    gasPrice: 5,
  }
);

// 卖出
const sellResult = await trading.sellToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  amount: 1000,
  bonusAmount: 0,
  gas: gasConfig,
});
```

## 常见问题

### Q: 如果 gasLimit 设置太低会怎样？
A: 交易会失败并显示 "out of gas" 错误，但你仍会损失已消耗的 gas 费用。

### Q: gasPrice 设置太低会怎样？
A: 交易可能会在内存池中等待很长时间，甚至永远不会被打包。

### Q: 如何知道应该设置多少 gasLimit？
A: 可以先用默认值测试一次，然后查看实际消耗，再设置为实际消耗的 1.2-1.5 倍。

### Q: BSC 支持 EIP-1559 吗？
A: 不支持，BSC 使用传统的 gasPrice 模式。

### Q: 可以只设置 gasLimit 不设置 gasPrice 吗？
A: 可以，不设置的参数会使用默认值（网络当前价格）。

```typescript
gas: {
  gasLimit: 500000,
  // gasPrice 会自动使用网络价格
}
```

## Gas 优化建议

1. **测试环境先试验**: 在测试网测试不同的 gas 配置
2. **监控网络拥堵**: 网络拥堵时提高 gasPrice
3. **预留充足 gasLimit**: 宁可多设置一些，多余的会退还
4. **批量操作**: 如果有多笔交易，可以复用相同的 gas 配置
5. **紧急交易**: 需要快速确认时，可以设置 2-3 倍的 gasPrice

## 资源链接

- [BSCScan Gas Tracker](https://bscscan.com/gastracker)
- [Ethers.js Gas 文档](https://docs.ethers.org/v6/api/providers/#Provider-getFeeData)
- [EIP-1559 说明](https://eips.ethereum.org/EIPS/eip-1559)

## 总结

Gas 配置是可选的，主要用于：
- ✅ 控制交易成本
- ✅ 加快交易确认
- ✅ 避免 gas 不足导致失败
- ✅ 在网络拥堵时优先打包

如果不确定，可以先不设置 gas 参数，使用默认配置。
