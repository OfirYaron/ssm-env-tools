const envUtills = require('./env-utills.js');
const object2SSM = require('./object-to-ssm.js');

/* 
* @name EnvToSSM
* @description convert env file to SSM Params, will use machines AWS Credentials
* @param {string} envPath - path to env file
* @param {string} environment - environment name
* @param {string} serviceName - service name
* @param {boolean} dryRun - dry run flag (default false)
* @return {void}
*/
module.exports = function EnvToSSM(envPath, environment, serviceName, dryRun = false) {
  const envObject = envUtills(envPath);
  console.log(`Found ${Object.keys(envObject).length} environment keys`);
  object2SSM(envObject, { dryRun, environment, serviceName});
}