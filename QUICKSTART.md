# 🚀 快速开始 - FOUR Trading SDK

## 5分钟上手指南

### 第一步：安装 SDK

```bash
# 如果是本地开发
cd /path/to/your-project
npm install /Users/wood/WorkSpace/Solana-Projects/four-sdk

# 或者从 npm 安装（发布后）
npm install four-trading-sdk ethers
```

### 第二步：创建交易脚本

创建文件 `trade.js`:

```javascript
const { FourTrading } = require('four-trading-sdk');

async function main() {
  // 1. 初始化 SDK
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: '你的私钥', // 实际使用时用 process.env.PRIVATE_KEY
  });

  console.log('钱包地址:', trading.getWalletAddress());
  console.log('BNB余额:', await trading.getBNBBalance());

  const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  // 2. 买入代币
  console.log('\n正在买入...');
  const buyResult = await trading.buyToken({
    tokenAddress: tokenAddress,
    fundsInBNB: 0.01,  // 使用 0.01 BNB
    minAmount: 0,
  });
  console.log('✅ 买入成功:', buyResult.txHash);

  // 3. 查看代币余额
  const balance = await trading.getTokenBalance(tokenAddress);
  console.log('代币余额:', balance);

  // 4. 卖出代币（需要先授权）
  console.log('\n正在授权...');
  await trading.approveToken(tokenAddress);
  console.log('✅ 授权完成');

  console.log('\n正在卖出...');
  const sellResult = await trading.sellToken({
    tokenAddress: tokenAddress,
    amount: 100,  // 卖出 100 个代币
    bonusAmount: 0,
  });
  console.log('✅ 卖出成功:', sellResult.txHash);
}

main().catch(console.error);
```

### 第三步：运行脚本

```bash
node trade.js
```

## 使用 TypeScript

创建 `trade.ts`:

```typescript
import { FourTrading } from 'four-trading-sdk';

async function main() {
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: process.env.PRIVATE_KEY!,
  });

  // 买入
  await trading.buyToken({
    tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
    fundsInBNB: 0.01,
    minAmount: 0,
  });
}

main();
```

运行：
```bash
npx ts-node trade.ts
```

## 使用环境变量（推荐）

### 1. 创建 `.env` 文件

```env
PRIVATE_KEY=你的私钥（不要有0x前缀）
TOKEN_ADDRESS=0x6d97e28527582d1be954fde04e83c8e4bbd44444
```

### 2. 安装 dotenv

```bash
npm install dotenv
```

### 3. 在代码中使用

```javascript
require('dotenv').config();
const { FourTrading } = require('four-trading-sdk');

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed1.binance.org/',
  privateKey: process.env.PRIVATE_KEY,
});

// 使用环境变量中的代币地址
const tokenAddress = process.env.TOKEN_ADDRESS;
```

## 核心 API 速查

### 买入代币
```javascript
await trading.buyToken({
  tokenAddress: '0x...',    // 代币合约地址
  fundsInBNB: 0.1,          // 花费多少 BNB
  minAmount: 0,             // 最少收到多少代币（可选）
});
```

### 卖出代币
```javascript
// 首次卖出前需要授权（每个代币只需一次）
await trading.approveToken('0x...');

// 卖出
await trading.sellToken({
  tokenAddress: '0x...',    // 代币合约地址
  amount: 1000,             // 卖出数量
  bonusAmount: 0,           // 通常为 0
});
```

### 查询余额
```javascript
// BNB 余额
const bnb = await trading.getBNBBalance();

// 代币余额
const tokens = await trading.getTokenBalance('0x...');

// 钱包地址
const address = trading.getWalletAddress();
```

## 完整示例

```javascript
const { FourTrading } = require('four-trading-sdk');

async function trade() {
  const trading = new FourTrading({
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    privateKey: process.env.PRIVATE_KEY,
  });

  const token = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

  try {
    // 查看初始余额
    console.log('BNB:', await trading.getBNBBalance());
    console.log('Token:', await trading.getTokenBalance(token));

    // 买入
    const buy = await trading.buyToken({
      tokenAddress: token,
      fundsInBNB: 0.01,
      minAmount: 0,
    });
    console.log('买入成功:', buy.txHash);

    // 等待一下，让区块确认
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 授权
    await trading.approveToken(token);
    console.log('授权成功');

    // 卖出一半
    const balance = await trading.getTokenBalance(token);
    const sellAmount = parseFloat(balance) / 2;

    const sell = await trading.sellToken({
      tokenAddress: token,
      amount: sellAmount,
      bonusAmount: 0,
    });
    console.log('卖出成功:', sell.txHash);

    // 查看最终余额
    console.log('最终 BNB:', await trading.getBNBBalance());
    console.log('最终 Token:', await trading.getTokenBalance(token));

  } catch (error) {
    console.error('错误:', error.message);
  }
}

trade();
```

## 在浏览器中查看交易

所有交易可以在 BSCScan 查看：
```
https://bscscan.com/tx/你的交易哈希
```

## 常见错误

### 1. 余额不足
```
Error: insufficient funds
```
**解决**: 确保钱包有足够的 BNB

### 2. 授权失败
```
Error: execution reverted
```
**解决**: 卖出前先调用 `approveToken()`

### 3. 私钥错误
```
Error: invalid private key
```
**解决**: 检查私钥格式，不要包含 `0x` 前缀

### 4. RPC 连接失败
```
Error: could not detect network
```
**解决**: 检查网络连接，或更换 RPC 地址

## 安全提醒

⚠️ **重要**:
1. 永远不要把私钥写在代码里
2. 不要把 `.env` 文件提交到 git
3. 先用小金额测试
4. 在测试网测试后再用主网

## 测试网测试

BSC 测试网配置：
```javascript
const trading = new FourTrading({
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  privateKey: process.env.TESTNET_PRIVATE_KEY,
});
```

测试网水龙头获取测试 BNB：
https://testnet.binance.org/faucet-smart

## 下一步

- 查看 [完整文档](./README.md)
- 查看 [使用指南](./USAGE.md)
- 查看 [示例代码](./examples/fourTradingExample.ts)
- 查看 [项目结构](./PROJECT_STRUCTURE.md)

## 需要帮助？

遇到问题可以：
1. 查看错误信息并在文档中搜索
2. 检查示例代码
3. 确认网络连接和 RPC 状态
4. 验证私钥和地址格式

祝交易顺利！🎉
