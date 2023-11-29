const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const readline = require('readline-sync');
const fs = require('fs');

const client = new SSMClient({
  apiVersion: '2014-11-06',
});

const stsClient = new STSClient({
  apiVersion: '2014-11-06',
});

const getServiceParameters = async (environment, segmentName) => {
  let nextToken;
  allParameters = [];
  do {
    const command = new GetParametersByPathCommand({
      Path: `/${environment}/${segmentName}/`,
      WithDecryption: true,
      NextToken: nextToken, // Include the NextToken from the previous response
    });

    const environmentVariables = await client.send(command);
    process.stdout.write('.');
    allParameters.push(...environmentVariables.Parameters);

    // Update nextToken for the next iteration
    nextToken = environmentVariables.NextToken;
  } while (nextToken); // Continue the loop until there are no more pages

  return allParameters.map(param => ({
    name: param.Name, 
    value: param.Value, 
    envName: param.Name.split('/')[param.Name.split('/').length-1]
  }));
}

module.exports = async (path, environment, serviceName, dryrun, hidePrompt) => {
  if (!hidePrompt) {
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('This script will use your AWS credentials to create .env file from SSM Parameters .');
    console.log('This script will use the following options:');
    console.log(`- Account: ${stsResponse.Account}`);
    console.log(`- Environment: ${environment}`);
    console.log(`- Service Name: ${serviceName}`);
    console.log(`- Path: ${path}`);
    const answer = readline.question('Are you sure you want to continue? (y/n) ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Exiting...');
      process.exit(0);
    }
  }
  console.log(`# getting parameters for ${serviceName} at environment: ${environment}`);
  const serviceEnvs = await getServiceParameters(environment, serviceName);

  if (dryrun) {
    console.log(`# dry run: ${serviceName} at environment: ${environment} will have the following parameters:`);
    console.log(serviceEnvs.map(envParam => `${envParam.envName}="${envParam.value}"`).join("\n"));
  } else {
    // save to .env file
    fs.writeFileSync(
      path, 
      serviceEnvs.map(envParam => `${envParam.envName}="${envParam.value}"`).join("\n"));
    console.log(`# saved parameters to ${path}`);
  }
}