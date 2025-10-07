# Gas 配置功能更新总结

## 🎉 更新内容

已成功添加用户自定义 Gas Price 和 Gas Limit 功能！

### ✨ 新增功能

1. **GasOptions 接口** - 完整的 gas 配置选项
2. **灵活的 gas 设置** - 支持 legacy 和 EIP-1559 两种模式
3. **所有方法支持** - buyToken、sellToken、approveToken 都支持 gas 配置
4. **自动单位转换** - Gas price 自动从 Gwei 转换为 wei
5. **可选配置** - 不提供则使用网络默认值

## 📝 API 变化

### 之前（v1.0.0）
```typescript
// 硬编码的 gasLimit
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  minAmount: 0,
});
// 内部使用固定的 gasLimit: 500000
```

### 现在（v1.1.0）
```typescript
// 用户可以自定义
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 600000,   // 自定义 limit
    gasPrice: 10,       // 自定义 price (Gwei)
  }
});

// 或者不提供，使用默认值
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  // 不提供 gas，自动使用网络默认值
});
```

## 🆕 新增接口

```typescript
export interface GasOptions {
  gasLimit?: number | string;
  gasPrice?: number | string;           // Legacy 模式
  maxFeePerGas?: number | string;       // EIP-1559
  maxPriorityFeePerGas?: number | string; // EIP-1559
}

export interface BuyParams {
  tokenAddress: string;
  fundsInBNB: number | string;
  minAmount?: number | string;
  gas?: GasOptions;  // 新增
}

export interface SellParams {
  tokenAddress: string;
  amount: number | string;
  bonusAmount?: number | string;
  gas?: GasOptions;  // 新增
}
```

## 🔧 方法签名变化

### buyToken
```typescript
// 之前
buyToken(params: BuyParams)

// 现在（BuyParams 包含 gas 选项）
buyToken(params: BuyParams)  // BuyParams 现在有 gas?: GasOptions
```

### sellToken
```typescript
// 之前
sellToken(params: SellParams)

// 现在（SellParams 包含 gas 选项）
sellToken(params: SellParams)  // SellParams 现在有 gas?: GasOptions
```

### approveToken
```typescript
// 之前
approveToken(tokenAddress: string, amount?: number | string)

// 现在
approveToken(tokenAddress: string, amount?: number | string, gas?: GasOptions)
```

## 💡 使用示例

### 示例 1: 基础用法（使用默认 gas）
```typescript
// 不提供 gas，使用网络默认值
await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
});
```

### 示例 2: 自定义 Gas Limit 和 Price
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

### 示例 3: 高优先级交易
```typescript
// 使用更高的 gas price 确保快速打包
await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 600000,
    gasPrice: 20,  // 20 Gwei - 高优先级
  }
});
```

### 示例 4: 只设置 Gas Limit
```typescript
// 只设置 limit，price 使用网络默认
await trading.buyToken({
  tokenAddress: '0x6d97e28527582d1be954fde04e83c8e4bbd44444',
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: {
    gasLimit: 500000,
    // gasPrice 自动使用网络价格
  }
});
```

### 示例 5: 完整交易流程
```typescript
const tokenAddress = '0x6d97e28527582d1be954fde04e83c8e4bbd44444';

// 统一的 gas 配置
const gasConfig = {
  gasLimit: 500000,
  gasPrice: 5,
};

// 买入
await trading.buyToken({
  tokenAddress,
  fundsInBNB: 0.1,
  minAmount: 0,
  gas: gasConfig,
});

// 授权
await trading.approveToken(tokenAddress, undefined, {
  gasLimit: 100000,
  gasPrice: 5,
});

// 卖出
await trading.sellToken({
  tokenAddress,
  amount: 1000,
  bonusAmount: 0,
  gas: gasConfig,
});
```

## 📚 新增文档

- **GAS_CONFIGURATION.md** - 完整的 Gas 配置指南
  - Gas 单位说明
  - Legacy vs EIP-1559 模式
  - 查询当前 gas price
  - 推荐配置
  - 动态 gas 设置
  - 常见问题解答

## 🔄 代码改动

### 新增私有方法
```typescript
private buildTxOptions(gas?: GasOptions, value?: bigint): any {
  const options: any = {};
  
  if (value !== undefined) {
    options.value = value;
  }
  
  if (gas) {
    if (gas.gasLimit) {
      options.gasLimit = BigInt(gas.gasLimit);
    }
    if (gas.gasPrice) {
      options.gasPrice = ethers.parseUnits(gas.gasPrice.toString(), 'gwei');
    }
    if (gas.maxFeePerGas) {
      options.maxFeePerGas = ethers.parseUnits(gas.maxFeePerGas.toString(), 'gwei');
    }
    if (gas.maxPriorityFeePerGas) {
      options.maxPriorityFeePerGas = ethers.parseUnits(
        gas.maxPriorityFeePerGas.toString(),
        'gwei'
      );
    }
  }
  
  return options;
}
```

### 更新的方法
- `buyToken`: 使用 `buildTxOptions(params.gas, fundsWei)`
- `sellToken`: 使用 `buildTxOptions(params.gas)`
- `approveToken`: 接受第三个参数 `gas`，使用 `buildTxOptions(gas)`

## ✅ 向后兼容

**完全向后兼容！**

之前的代码无需任何修改即可继续工作：

```typescript
// v1.0.0 的代码在 v1.1.0 中依然有效
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  minAmount: 0,
  // 不提供 gas，使用默认行为
});
```

## 🎯 好处

1. **完全控制** - 用户可以完全控制 gas 费用
2. **灵活性** - 可以根据网络状况动态调整
3. **优化成本** - 不急的交易可以使用低 gas
4. **优先打包** - 紧急交易可以使用高 gas
5. **防止失败** - 可以设置足够的 gasLimit 避免 out of gas

## 📈 版本对比

| 功能 | v1.0.0 | v1.1.0 |
|------|--------|--------|
| 买入代币 | ✅ | ✅ |
| 卖出代币 | ✅ | ✅ |
| 授权代币 | ✅ | ✅ |
| 查询余额 | ✅ | ✅ |
| 自定义 Gas Limit | ❌ | ✅ |
| 自定义 Gas Price | ❌ | ✅ |
| EIP-1559 支持 | ❌ | ✅ |
| Gas 文档 | ❌ | ✅ |

## 📦 构建验证

```bash
npm run build
✅ Build successful!

文件大小：
- fourTrading.js: 6.5K (增加了 gas 配置逻辑)
- fourTrading.d.ts: 2.1K (新增类型定义)
- index.js: 319B
- index.d.ts: 135B (导出 GasOptions)
```

## 🔐 安全性

- Gas 配置是可选的，不提供则使用安全的默认值
- 自动单位转换防止错误
- 支持 number 和 string 类型提供灵活性
- 完整的 TypeScript 类型检查

## 🚀 发布说明

更新版本号：`1.0.0` → `1.1.0` (minor version bump)

原因：新增功能，向后兼容

## 📝 更新的文档列表

1. ✅ README.md - 添加 Gas 配置章节和示例
2. ✅ GAS_CONFIGURATION.md - 新增完整 Gas 指南
3. ✅ examples/fourTradingExample.ts - 更新示例代码
4. ✅ CHANGELOG.md - 记录更新日志
5. ✅ src/index.ts - 导出 GasOptions 接口
6. ✅ package.json - 版本升级到 1.1.0

## 🎉 总结

成功添加了用户自定义 Gas 配置功能，让用户可以：

- ✅ 自由控制 Gas Limit 和 Gas Price
- ✅ 根据需求调整交易优先级
- ✅ 优化交易成本
- ✅ 支持两种 gas 定价模式
- ✅ 完全向后兼容

SDK 现在更加灵活和强大！🚀
