const InfoContracts = artifacts.require('InfoContract')
const DataStorage = artifacts.require('DataStorage')
// const RedPackage = artifacts.require('RedPackage')
module.exports = function (deployer) {
  deployer.deploy(DataStorage)
  // deployer.deploy(RedPackage)
  deployer.deploy(InfoContracts)
}
