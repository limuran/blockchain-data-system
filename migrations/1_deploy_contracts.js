// const InfoContracts = artifacts.require('InfoContract')
const DataStorage = artifacts.require('DataStorage')
module.exports = function (deployer) {
  deployer.deploy(DataStorage)
}
