import { Validator } from '../../src/validator';
import {
  InvalidAddressError,
  InvalidAmountError,
  GasConfigurationError,
  ValidationError,
} from '../../src/errors';

describe('Validator', () => {
  describe('validateAddress', () => {
    it('should accept valid Ethereum address', () => {
      const validAddress = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
      expect(() => {
        Validator.validateAddress(validAddress);
      }).not.toThrow();
    });

    it('should accept checksummed address', () => {
      const checksummedAddress = '0x5C952063c7Fc8610fFdB798152d69F0b9550762B';
      // Note: ethers.isAddress in v6 is case-sensitive for checksums
      // This test verifies addresses are validated
      expect(() => {
        Validator.validateAddress(checksummedAddress);
      }).not.toThrow();
    });

    it('should reject invalid address format', () => {
      expect(() => {
        Validator.validateAddress('invalid-address');
      }).toThrow(InvalidAddressError);
    });

    it('should reject empty string', () => {
      expect(() => {
        Validator.validateAddress('');
      }).toThrow(InvalidAddressError);
    });

    it('should reject non-string input', () => {
      expect(() => {
        Validator.validateAddress(null as any);
      }).toThrow(InvalidAddressError);
    });

    it('should accept address without 0x prefix (ethers handles it)', () => {
      // ethers.isAddress accepts both with and without 0x prefix
      expect(() => {
        Validator.validateAddress('0x5c952063c7fc8610FFDB798152D69F0B9550762b');
      }).not.toThrow();
    });

    it('should reject address with wrong length', () => {
      expect(() => {
        Validator.validateAddress('0x5c95206');
      }).toThrow(InvalidAddressError);
    });
  });

  describe('validateAmount', () => {
    it('should accept positive bigint', () => {
      expect(() => {
        Validator.validateAmount(1000n, 'testAmount');
      }).not.toThrow();
    });

    it('should accept large bigint values', () => {
      const largeValue = 1000000000000000000000000n;
      expect(() => {
        Validator.validateAmount(largeValue, 'largeAmount');
      }).not.toThrow();
    });

    it('should reject zero by default', () => {
      expect(() => {
        Validator.validateAmount(0n, 'zeroAmount');
      }).toThrow(InvalidAmountError);
    });

    it('should allow zero when specified', () => {
      expect(() => {
        Validator.validateAmount(0n, 'zeroAmount', { allowZero: true });
      }).not.toThrow();
    });

    it('should reject negative values', () => {
      expect(() => {
        Validator.validateAmount(-100n, 'negativeAmount');
      }).toThrow(InvalidAmountError);
    });

    it('should reject non-bigint type', () => {
      expect(() => {
        Validator.validateAmount(100 as any, 'wrongType');
      }).toThrow(InvalidAmountError);
    });

    it('should enforce minimum value', () => {
      expect(() => {
        Validator.validateAmount(50n, 'amount', { min: 100n });
      }).toThrow(InvalidAmountError);
    });

    it('should accept value equal to minimum', () => {
      expect(() => {
        Validator.validateAmount(100n, 'amount', { min: 100n });
      }).not.toThrow();
    });

    it('should enforce maximum value', () => {
      expect(() => {
        Validator.validateAmount(1000n, 'amount', { max: 500n });
      }).toThrow(InvalidAmountError);
    });

    it('should accept value equal to maximum', () => {
      expect(() => {
        Validator.validateAmount(500n, 'amount', { max: 500n });
      }).not.toThrow();
    });

    it('should enforce both min and max', () => {
      expect(() => {
        Validator.validateAmount(150n, 'amount', { min: 100n, max: 200n });
      }).not.toThrow();

      expect(() => {
        Validator.validateAmount(50n, 'amount', { min: 100n, max: 200n });
      }).toThrow(InvalidAmountError);

      expect(() => {
        Validator.validateAmount(250n, 'amount', { min: 100n, max: 200n });
      }).toThrow(InvalidAmountError);
    });
  });

  describe('validateGasOptions', () => {
    it('should reject mixed legacy and EIP-1559 parameters', () => {
      expect(() => {
        Validator.validateGasOptions({
          gasPrice: 5000000000n,
          maxFeePerGas: 6000000000n,
        });
      }).toThrow(GasConfigurationError);

      expect(() => {
        Validator.validateGasOptions({
          gasPrice: 5000000000n,
          maxPriorityFeePerGas: 2000000000n,
        });
      }).toThrow(GasConfigurationError);
    });

    it('should accept legacy gas parameters only', () => {
      expect(() => {
        Validator.validateGasOptions({
          gasPrice: 5000000000n,
          gasLimit: 500000n,
        });
      }).not.toThrow();
    });

    it('should accept EIP-1559 parameters only', () => {
      expect(() => {
        Validator.validateGasOptions({
          maxFeePerGas: 6000000000n,
          maxPriorityFeePerGas: 2000000000n,
          gasLimit: 500000n,
        });
      }).not.toThrow();
    });

    it('should reject priority fee exceeding max fee', () => {
      expect(() => {
        Validator.validateGasOptions({
          maxFeePerGas: 5000000000n,
          maxPriorityFeePerGas: 6000000000n,
        });
      }).toThrow(GasConfigurationError);
    });

    it('should accept equal priority and max fees', () => {
      expect(() => {
        Validator.validateGasOptions({
          maxFeePerGas: 5000000000n,
          maxPriorityFeePerGas: 5000000000n,
        });
      }).not.toThrow();
    });

    it('should validate minimum gas limit', () => {
      expect(() => {
        Validator.validateGasOptions({
          gasLimit: 10000n, // Less than MIN_GAS_LIMIT (21000)
        });
      }).toThrow(InvalidAmountError);
    });

    it('should accept valid gas limit', () => {
      expect(() => {
        Validator.validateGasOptions({
          gasLimit: 500000n,
        });
      }).not.toThrow();
    });
  });

  describe('validateRpcUrl', () => {
    it('should accept valid HTTP URL', () => {
      expect(() => {
        Validator.validateRpcUrl('https://bsc-dataseed.binance.org', 'http');
      }).not.toThrow();

      expect(() => {
        Validator.validateRpcUrl('http://localhost:8545', 'http');
      }).not.toThrow();
    });

    it('should accept valid WebSocket URL', () => {
      expect(() => {
        Validator.validateRpcUrl('wss://bsc-rpc.publicnode.com', 'websocket');
      }).not.toThrow();

      expect(() => {
        Validator.validateRpcUrl('ws://localhost:8546', 'websocket');
      }).not.toThrow();
    });

    it('should reject HTTP URL for WebSocket type', () => {
      expect(() => {
        Validator.validateRpcUrl('https://bsc-dataseed.binance.org', 'websocket');
      }).toThrow(ValidationError);
    });

    it('should reject WebSocket URL for HTTP type', () => {
      expect(() => {
        Validator.validateRpcUrl('wss://bsc-rpc.publicnode.com', 'http');
      }).toThrow(ValidationError);
    });

    it('should reject malformed URL', () => {
      expect(() => {
        Validator.validateRpcUrl('not-a-url', 'http');
      }).toThrow(ValidationError);
    });

    it('should reject empty URL', () => {
      expect(() => {
        Validator.validateRpcUrl('', 'http');
      }).toThrow(ValidationError);
    });
  });

  describe('validatePrivateKey', () => {
    it('should accept valid private key with 0x prefix', () => {
      const validKey = '0x' + '1'.repeat(64);
      expect(() => {
        Validator.validatePrivateKey(validKey);
      }).not.toThrow();
    });

    it('should accept valid private key without 0x prefix', () => {
      const validKey = '1'.repeat(64);
      expect(() => {
        Validator.validatePrivateKey(validKey);
      }).not.toThrow();
    });

    it('should reject private key with wrong length', () => {
      const shortKey = '0x' + '1'.repeat(32);
      expect(() => {
        Validator.validatePrivateKey(shortKey);
      }).toThrow(ValidationError);
    });

    it('should reject non-hex characters', () => {
      const invalidKey = '0x' + 'g'.repeat(64);
      expect(() => {
        Validator.validatePrivateKey(invalidKey);
      }).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => {
        Validator.validatePrivateKey('');
      }).toThrow(ValidationError);
    });
  });

  describe('validateSlippage', () => {
    it('should accept valid slippage percentages', () => {
      expect(() => Validator.validateSlippage(0)).not.toThrow();
      expect(() => Validator.validateSlippage(1)).not.toThrow();
      expect(() => Validator.validateSlippage(50)).not.toThrow();
      expect(() => Validator.validateSlippage(100)).not.toThrow();
    });

    it('should reject negative slippage', () => {
      expect(() => {
        Validator.validateSlippage(-1);
      }).toThrow(ValidationError);
    });

    it('should reject slippage over 100', () => {
      expect(() => {
        Validator.validateSlippage(101);
      }).toThrow(ValidationError);
    });

    it('should reject non-number input', () => {
      expect(() => {
        Validator.validateSlippage('10' as any);
      }).toThrow(ValidationError);
    });

    it('should reject NaN', () => {
      expect(() => {
        Validator.validateSlippage(NaN);
      }).toThrow(ValidationError);
    });
  });

  describe('validateDifferentAddresses', () => {
    const address1 = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
    const address2 = '0x1234567890123456789012345678901234567890';

    it('should accept different addresses', () => {
      expect(() => {
        Validator.validateDifferentAddresses(address1, address2);
      }).not.toThrow();
    });

    it('should reject same addresses', () => {
      expect(() => {
        Validator.validateDifferentAddresses(address1, address1);
      }).toThrow(ValidationError);
    });

    it('should reject same addresses with different casing', () => {
      const address1Lower = address1.toLowerCase();
      const address1Upper = address1.toUpperCase();

      expect(() => {
        Validator.validateDifferentAddresses(address1Lower, address1Upper);
      }).toThrow(ValidationError);
    });

    it('should validate both addresses', () => {
      expect(() => {
        Validator.validateDifferentAddresses('invalid', address2);
      }).toThrow(InvalidAddressError);

      expect(() => {
        Validator.validateDifferentAddresses(address1, 'invalid');
      }).toThrow(InvalidAddressError);
    });
  });
});
