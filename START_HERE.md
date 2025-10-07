# 👋 欢迎使用 FOUR Trading SDK

## 🎯 这是什么？

这是一个用于在 BSC（币安智能链）上与 FOUR 发射平台交互的 TypeScript SDK。

你可以用它来：
- 💰 使用 BNB 买入代币
- 💸 卖出代币换取 BNB
- 📊 查询余额

## 🚀 3步开始使用

### 1️⃣ 安装 SDK

在你的项目中：
```bash
npm install four-trading-sdk ethers
```

### 2️⃣ 写代码

```javascript
const { FourTrading } = require('four-trading-sdk');

const trading = new FourTrading({
  rpcUrl: 'https://bsc-dataseed1.binance.org/',
  privateKey: '你的私钥',
});

// 买入代币
await trading.buyToken({
  tokenAddress: '0x代币地址',
  fundsInBNB: 0.1,  // 花费 0.1 BNB
  minAmount: 0,
});
```

### 3️⃣ 运行

```bash
node your-script.js
```

就这么简单！✅

## 📚 接下来读什么？

根据你的需求选择：

### 我想快速上手
👉 阅读 [QUICKSTART.md](./QUICKSTART.md)
- 5分钟快速入门
- 完整的买卖示例
- 常见错误解决

### 我想看详细文档
👉 阅读 [README.md](./README.md)
- 完整的 API 文档
- 所有功能说明
- 英文版

### 我想看中文教程
👉 阅读 [USAGE.md](./USAGE.md)
- 详细的中文指南
- 环境配置
- 高级用法
- 错误处理

### 我想了解项目结构
👉 阅读 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- 目录结构说明
- 开发工作流
- 如何扩展功能

### 我想看完整示例代码
👉 查看 [examples/fourTradingExample.ts](./examples/fourTradingExample.ts)
- 可运行的完整示例
- 买入和卖出流程
- 余额查询

### 我想了解技术细节
👉 阅读 [FOUR_TRADING_README.md](./FOUR_TRADING_README.md)
- 合约信息
- 交易数据格式
- 方法签名

### 我想知道所有功能
👉 阅读 [SDK_SUMMARY.md](./SDK_SUMMARY.md)
- 功能清单
- 技术栈
- 发布流程

## ⚡ 快速示例

### 买入代币
```javascript
const result = await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
});
console.log('交易哈希:', result.txHash);
```

### 卖出代币
```javascript
// 先授权（每个代币只需一次）
await trading.approveToken('0x6d97e28527582d1be954fde04e83c8e4bbd44444');

// 再卖出
await trading.sellToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  amount: 1000,
  bonusAmount: 0,
});
```

### 查询余额
```javascript
const bnb = await trading.getBNBBalance();
const tokens = await trading.getTokenBalance('0x代币地址');
console.log('BNB:', bnb);
console.log('代币:', tokens);
```

## 🔐 安全提醒

⚠️ **重要**：
- 永远不要把私钥写在代码里
- 使用环境变量：`process.env.PRIVATE_KEY`
- 不要把 `.env` 文件提交到 git
- 先在测试网测试

## 💬 需要帮助？

1. 先查看 [QUICKSTART.md](./QUICKSTART.md) 的常见问题部分
2. 查看 [示例代码](./examples/fourTradingExample.ts)
3. 阅读完整的 [使用指南](./USAGE.md)

## 📁 项目文件导航

```
📄 START_HERE.md           ← 你在这里！
📄 QUICKSTART.md           → 快速开始（推荐）
📄 README.md               → 完整文档（英文）
📄 USAGE.md                → 使用指南（中文）
📄 PROJECT_STRUCTURE.md    → 项目结构
📄 SDK_SUMMARY.md          → 功能总结
📄 FOUR_TRADING_README.md  → 技术细节

📁 src/                    → 源代码
📁 dist/                   → 编译后代码
📁 examples/               → 示例代码
```

## 🎯 我该从哪里开始？

- **如果你是新手** → 读 [QUICKSTART.md](./QUICKSTART.md)
- **如果你有经验** → 直接看 [README.md](./README.md) 或 [示例代码](./examples/fourTradingExample.ts)
- **如果要集成到项目** → 读 [USAGE.md](./USAGE.md)
- **如果要开发扩展** → 读 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

**准备好了吗？开始你的第一笔交易吧！** 🚀

下一步：👉 打开 [QUICKSTART.md](./QUICKSTART.md)
