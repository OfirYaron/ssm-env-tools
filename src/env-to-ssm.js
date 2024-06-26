const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const envUtills = require('./env-utills.js');
const object2SSM = require('./object-to-ssm.js');
const readline = require('readline-sync');

const stsClient = new STSClient({
  apiVersion: '2014-11-06',
});

/* 
* @name EnvToSSM
* @description convert env file to SSM Params, will use machines AWS Credentials
* @param {string} envPath - path to env file
* @param {string} environment - environment name
* @param {string} serviceName - service name
* @param {boolean} dryRun - dry run flag (default false)
* @param {boolean} showPrompt - showing prompt before continue
* @return {void}
*/
module.exports = async function EnvToSSM(envPath, environment, serviceName, dryRun = false, skipPrompt, region) {
  if (!skipPrompt) {
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('This script will use your AWS credentials to create SSM Parameters from the .env file.');
    console.log('This script will use the following options:');
    console.log(`- Account: ${stsResponse.Account}`);
    console.log(`- Region: ${region ? region : 'default'}`);
    console.log(`- Environment: ${environment}`);
    console.log(`- Service Name: ${serviceName}`);
    console.log(`- Env Path: ${envPath}`);

    const answer = readline.question('Are you sure you want to continue? (y/n) ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Exiting...');
      process.exit(0);
    }
  }

  // TBD: Add a check whether parameters on this 'env' and 'service' exists in case of !hidePrompt 

  const envObject = envUtills(envPath);
  console.log(`Found ${Object.keys(envObject).length} environment keys`);
  object2SSM(envObject, { dryRun, environment, serviceName, region});
}