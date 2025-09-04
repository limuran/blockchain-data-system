require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')

const { MNEMONIC, INFURA_PROJECT_ID, ETHERSCAN_API_KEY } = process.env

module.exports = {
  networks: {
    // 本地开发网络
    development: {
      host: '127.0.0.1',
      port: 7545, // Ganache默认端口
      network_id: '*'
    },

    // Sepolia 测试网
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          MNEMONIC,
          `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`
        ),
      network_id: 11155111, // Sepolia网络ID
      gas: 5500000, // Gas限制
      gasPrice: 20000000000, // 20 Gwei
      confirmations: 2, // 等待2个区块确认
      timeoutBlocks: 200, // 200个区块后超时
      skipDryRun: true // 跳过预演（测试网推荐）
    },

    // 以太坊主网（生产环境，谨慎使用）
    mainnet: {
      provider: () =>
        new HDWalletProvider(
          MNEMONIC,
          `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
        ),
      network_id: 1,
      gas: 5500000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false // 主网必须预演
    }
  },

  // Mocha测试配置
  mocha: {
    timeout: 100000
  },

  // 编译器配置
  compilers: {
    solc: {
      version: '0.8.19', // 匹配你的合约版本
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: 'byzantium'
      }
    }
  },

  // 验证插件配置（可选）
  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  }
}
