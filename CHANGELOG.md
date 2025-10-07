# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-10-08

### Added
- ✨ **Customizable Gas Configuration**: Users can now set custom `gasLimit`, `gasPrice`, `maxFeePerGas`, and `maxPriorityFeePerGas`
- 📚 **Gas Configuration Guide**: Added comprehensive `GAS_CONFIGURATION.md` documentation
- 🎯 **GasOptions Interface**: New TypeScript interface for gas settings
- 🔧 **Flexible Gas Settings**: Support for both legacy (gasPrice) and EIP-1559 (maxFeePerGas) modes

### Changed
- 🔄 **buyToken**: Now accepts optional `gas` parameter in `BuyParams`
- 🔄 **sellToken**: Now accepts optional `gas` parameter in `SellParams`
- 🔄 **approveToken**: Now accepts optional `gas` parameter as third argument
- 📝 **Documentation**: Updated all docs with gas configuration examples

### Technical Details
- Added private method `buildTxOptions()` to construct transaction options
- Gas prices are automatically converted from Gwei to wei
- Default behavior unchanged: if no gas options provided, uses network defaults

### Example
```typescript
// New gas configuration support
await trading.buyToken({
  tokenAddress: '0x...',
  fundsInBNB: 0.1,
  gas: {
    gasLimit: 500000,
    gasPrice: 5,  // 5 Gwei
  }
});
```

## [1.0.0] - 2025-10-07

### Added
- 🎉 Initial release
- ✅ Buy tokens using BNB
- ✅ Sell tokens for BNB
- ✅ Approve token spending
- ✅ Query BNB and token balances
- ✅ Full TypeScript support
- ✅ Complete documentation
- ✅ Example code

### Features
- Support for number and string parameter types
- Automatic unit conversion (BNB ↔ wei)
- Error handling and logging
- Type-safe API

### Documentation
- README.md - Main documentation
- USAGE.md - Chinese usage guide
- QUICKSTART.md - Quick start guide
- PROJECT_STRUCTURE.md - Project structure
- SDK_SUMMARY.md - Feature summary
- START_HERE.md - Getting started guide
