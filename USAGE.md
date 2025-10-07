# 如何使用 FOUR Trading SDK

## 安装步骤

### 1. 安装 SDK 到你的项目

如果你想在其他项目中使用这个 SDK：

```bash
# 在你的项目目录中
npm install /path/to/four-sdk
# 或者
yarn add /path/to/four-sdk
```

如果发布到 npm 后：
```bash
npm install four-trading-sdk
```

### 2. 在你的项目中导入和使用

创建文件 `trade.ts` 或 `trade.js`:

```typescript
import { FourTrading } from 'four-trading-sdk';

async function buyToken() {
  // 初始化 SDK
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: process.env.PRIVATE_KEY!, // 从环境变量读取私钥
  });

  console.log('钱包地址:', trading.getWalletAddress());
  console.log('BNB 余额:', await trading.getBNBBalance());

  // 购买代币
  const result = await trading.buyToken({
    tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
    fundsInBNB: 0.1,      // 使用 0.1 BNB 购买
    minAmount: 0,         // 最少收到的代币数量（0 = 不限制滑点）
  });

  console.log('购买成功! 交易哈希:', result.txHash);
  console.log('区块高度:', result.receipt.blockNumber);
}

async function sellToken() {
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: process.env.PRIVATE_KEY!,
  });

  const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  // 第一步：授权合约使用你的代币（每个代币只需要执行一次）
  console.log('授权中...');
  await trading.approveToken(tokenAddress);
  console.log('授权成功!');

  // 第二步：卖出代币
  const result = await trading.sellToken({
    tokenAddress: tokenAddress,
    amount: 1000,         // 卖出 1000 个代币
    bonusAmount: 0,       // 红利数量（通常为 0）
  });

  console.log('卖出成功! 交易哈希:', result.txHash);
}

// 执行
buyToken().catch(console.error);
// 或
// sellToken().catch(console.error);
```

### 3. JavaScript 用户 (CommonJS)

```javascript
const { FourTrading } = require('four-trading-sdk');

async function main() {
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: process.env.PRIVATE_KEY,
  });

  // 购买
  const buyResult = await trading.buyToken({
    tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
    fundsInBNB: 0.1,
    minAmount: 0,
  });

  console.log('买入成功:', buyResult.txHash);
}

main();
```

## 环境变量配置

创建 `.env` 文件：

```env
PRIVATE_KEY=你的私钥（不要包含 0x 前缀）
```

在代码中使用：

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed1.binance.org/',
  privateKey: process.env.PRIVATE_KEY!,
});
```

## 完整交易流程示例

```typescript
import { FourTrading } from 'four-trading-sdk';

async function tradingExample() {
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: process.env.PRIVATE_KEY!,
  });

  const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  try {
    // 1. 检查余额
    console.log('=== 初始余额 ===');
    console.log('BNB:', await trading.getBNBBalance());
    console.log('代币:', await trading.getTokenBalance(tokenAddress));

    // 2. 买入代币
    console.log('\n=== 买入代币 ===');
    const buyResult = await trading.buyToken({
      tokenAddress,
      fundsInBNB: 0.1,
      minAmount: 0,
    });
    console.log('✅ 买入成功:', buyResult.txHash);

    // 3. 查看买入后的余额
    console.log('\n=== 买入后余额 ===');
    console.log('BNB:', await trading.getBNBBalance());
    console.log('代币:', await trading.getTokenBalance(tokenAddress));

    // 4. 授权合约（如果还没授权过）
    console.log('\n=== 授权合约 ===');
    await trading.approveToken(tokenAddress);
    console.log('✅ 授权成功');

    // 5. 卖出部分代币
    console.log('\n=== 卖出代币 ===');
    const sellResult = await trading.sellToken({
      tokenAddress,
      amount: 500,  // 卖出 500 个代币
      bonusAmount: 0,
    });
    console.log('✅ 卖出成功:', sellResult.txHash);

    // 6. 查看最终余额
    console.log('\n=== 最终余额 ===');
    console.log('BNB:', await trading.getBNBBalance());
    console.log('代币:', await trading.getTokenBalance(tokenAddress));

  } catch (error) {
    console.error('❌ 交易失败:', error);
  }
}

tradingExample();
```

## 错误处理

```typescript
try {
  const result = await trading.buyToken({
    tokenAddress: '0x...',
    fundsInBNB: 0.1,
    minAmount: 0,
  });
  console.log('成功:', result.txHash);
} catch (error: any) {
  if (error.message.includes('insufficient funds')) {
    console.error('余额不足');
  } else if (error.message.includes('slippage')) {
    console.error('滑点超出限制');
  } else {
    console.error('交易失败:', error.message);
  }
}
```

## 高级用法

### 设置滑点保护

```typescript
// 买入时设置最少收到的代币数量
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  minAmount: 1000,  // 至少要收到 1000 个代币，否则交易失败
});
```

### 授权指定数量

```typescript
// 授权特定数量而不是无限授权
await trading.approveToken(tokenAddress, 10000);  // 只授权 10000 个代币
```

### 使用 string 类型传递大数值

```typescript
// 对于非常大的数字，使用字符串避免精度问题
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: '0.123456789123456789',  // 高精度
  minAmount: '1000000000000000000',    // 1e18
});
```

## 网络配置

### BSC 主网
```typescript
rpcUrl: 'https://bsc-dataseed1.binance.org/'
```

### BSC 测试网
```typescript
rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
```

## 注意事项

1. **私钥安全**：永远不要把私钥写在代码里或提交到 git
2. **测试网测试**：先在测试网测试，确认无误后再用主网
3. **授权一次**：每个代币只需要授权一次，不需要每次卖出都授权
4. **Gas 费用**：每次交易需要消耗 BNB 作为 gas 费
5. **滑点设置**：在价格波动大的情况下，建议设置 `minAmount` 防止滑点过大

## 查看交易

所有交易可以在 BSCScan 上查看：
```
https://bscscan.com/tx/YOUR_TX_HASH
```

## 常见问题

**Q: 为什么卖出失败？**
A: 请先调用 `approveToken()` 授权合约使用你的代币。

**Q: 如何查看当前代币余额？**
A: 使用 `await trading.getTokenBalance(tokenAddress)`

**Q: Gas 费用多少？**
A: 默认设置 gas limit 为 500,000，实际消耗会根据链上情况动态调整。

**Q: 支持其他链吗？**
A: 目前只支持 BSC（Binance Smart Chain）。
