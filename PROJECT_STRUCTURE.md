# FOUR Trading SDK - 项目结构

## 📁 目录结构

```
four-sdk/
├── src/                        # 源代码目录
│   ├── index.ts               # SDK 主入口，导出所有公开 API
│   └── fourTrading.ts         # 核心交易功能实现
│
├── dist/                       # 编译后的输出目录（npm 发布）
│   ├── index.js               # 编译后的主入口
│   ├── index.d.ts             # TypeScript 类型定义
│   ├── fourTrading.js         # 编译后的核心模块
│   └── fourTrading.d.ts       # TypeScript 类型定义
│
├── examples/                   # 使用示例
│   └── fourTradingExample.ts  # 完整的买卖示例代码
│
├── package.json               # npm 包配置
├── tsconfig.json              # TypeScript 编译配置
├── .gitignore                 # Git 忽略文件
├── .npmignore                 # npm 发布忽略文件
├── README.md                  # 英文文档（给 npm 用户看）
├── USAGE.md                   # 中文使用指南
├── FOUR_TRADING_README.md     # 技术实现说明
└── PROJECT_STRUCTURE.md       # 本文件
```

## 📦 核心文件说明

### `src/index.ts`
SDK 的主入口点，导出所有公开的 API：
- `FourTrading` - 主类
- `FourTradingConfig` - 配置接口
- `BuyParams` - 买入参数接口
- `SellParams` - 卖出参数接口

### `src/fourTrading.ts`
核心交易功能实现：
- 合约交互逻辑
- 买入、卖出、授权方法
- 余额查询功能
- 错误处理

### `package.json`
npm 包的核心配置：
```json
{
  "main": "dist/index.js",      // 入口文件
  "types": "dist/index.d.ts",   // TypeScript 类型定义
  "files": ["dist", "README.md"] // 发布时包含的文件
}
```

### `tsconfig.json`
TypeScript 编译配置：
- 编译目标：ES2020
- 输出目录：dist/
- 生成类型定义文件
- 严格模式开启

## 🔨 开发工作流

### 1. 开发阶段
```bash
# 安装依赖
npm install

# 监听文件变化，自动编译
npm run build:watch

# 编写代码
# 在 src/ 目录下修改代码
```

### 2. 构建阶段
```bash
# 清理旧的构建文件
npm run clean

# 编译 TypeScript
npm run build

# 检查 dist/ 目录
ls -la dist/
```

### 3. 测试阶段
```bash
# 运行示例代码
npm run example

# 或直接运行
ts-node examples/fourTradingExample.ts
```

### 4. 发布阶段
```bash
# 自动清理并构建
npm publish
```

## 🎯 使用 SDK

### 方式一：本地引用（开发测试）
```bash
# 在你的项目中
npm install /path/to/four-sdk
```

### 方式二：npm 包（发布后）
```bash
npm install four-trading-sdk
```

### 在代码中使用
```typescript
// TypeScript / ESM
import { FourTrading } from 'four-trading-sdk';

// CommonJS
const { FourTrading } = require('four-trading-sdk');
```

## 📊 构建产物说明

编译后的 `dist/` 目录包含：

1. **JavaScript 文件** (`.js`)
   - 实际运行的代码
   - CommonJS 格式
   - 兼容 Node.js

2. **类型定义文件** (`.d.ts`)
   - TypeScript 类型信息
   - 提供智能提示
   - 类型检查支持

3. **Source Map** (`.d.ts.map`)
   - 类型定义映射文件
   - 帮助 IDE 跳转到源码

## 🔐 忽略文件说明

### `.gitignore`
Git 版本控制忽略：
- `node_modules/` - 依赖包
- `dist/` - 编译产物（可以本地构建）
- `.env` - 环境变量（包含私钥）

### `.npmignore`
npm 发布时忽略：
- `src/` - 源代码（只发布编译后的代码）
- `examples/` - 示例代码
- `tsconfig.json` - 编译配置
- `.env` - 环境变量

## 📝 依赖说明

### 生产依赖 (dependencies)
- **ethers**: ^6.13.0
  - 与以太坊兼容链交互
  - 钱包管理
  - 合约调用
  - 交易签名

### 开发依赖 (devDependencies)
- **typescript**: ^5.5.0
  - TypeScript 编译器
- **@types/node**: ^20.14.0
  - Node.js 类型定义
- **ts-node**: ^10.9.2
  - 直接运行 TypeScript 文件

## 🚀 npm scripts 说明

```json
{
  "build": "tsc",                          // 编译 TypeScript
  "build:watch": "tsc --watch",            // 监听模式编译
  "clean": "rm -rf dist",                  // 清理构建产物
  "prepublishOnly": "npm run clean && npm run build",  // 发布前自动构建
  "example": "ts-node examples/fourTradingExample.ts"  // 运行示例
}
```

## 💡 最佳实践

### 版本管理
```bash
# 更新版本号
npm version patch   # 1.0.0 -> 1.0.1 (bug fix)
npm version minor   # 1.0.0 -> 1.1.0 (新功能)
npm version major   # 1.0.0 -> 2.0.0 (破坏性更新)
```

### 发布流程
```bash
# 1. 确保代码已提交
git status

# 2. 更新版本号
npm version patch

# 3. 构建（prepublishOnly 会自动执行）
npm publish

# 4. 推送到 git
git push --follow-tags
```

### 本地测试
```bash
# 在 SDK 目录
npm run build

# 在测试项目中
npm install /path/to/four-sdk

# 测试导入
node -e "const sdk = require('four-trading-sdk'); console.log(sdk)"
```

## 🔧 扩展开发

### 添加新功能
1. 在 `src/fourTrading.ts` 中添加新方法
2. 在 `src/index.ts` 中导出（如果需要公开）
3. 运行 `npm run build` 编译
4. 在 `examples/` 中添加使用示例
5. 更新 `README.md` 文档

### 示例：添加查询价格功能
```typescript
// src/fourTrading.ts
async getTokenPrice(tokenAddress: string): Promise<string> {
  // 实现逻辑
}

// src/index.ts
export { FourTrading } from './fourTrading';
// getTokenPrice 已经是 FourTrading 的方法，会自动导出
```

## 📚 相关文档

- `README.md` - 完整的 SDK 使用文档（英文）
- `USAGE.md` - 中文使用指南，包含大量示例
- `FOUR_TRADING_README.md` - 技术实现细节和交易数据格式
- `examples/fourTradingExample.ts` - 可运行的示例代码

## 🆘 故障排除

### 编译失败
```bash
# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 类型错误
```bash
# 检查 TypeScript 配置
cat tsconfig.json

# 确保严格模式配置正确
```

### 导入失败
```bash
# 确保已经编译
npm run build

# 检查 dist/ 目录是否存在
ls dist/

# 检查 package.json 的 main 字段
cat package.json | grep main
```
