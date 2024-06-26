const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const readline = require('readline-sync');
const fs = require('fs');

const stsClient = new STSClient({
  apiVersion: '2014-11-06',
});

const getServiceParameters = async (environment, segmentName, region) => {
  let nextToken;
  allParameters = [];
  do {
    const command = new GetParametersByPathCommand({
      Path: `/${environment}/${segmentName}/`,
      WithDecryption: true,
      NextToken: nextToken, // Include the NextToken from the previous response
    });

    const client = new SSMClient({
      apiVersion: '2014-11-06',
      region: region,
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

module.exports = async (path, environment, serviceName, dryRun, hidePrompt, region) => {
  if (!hidePrompt) {
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log('This script will use your AWS credentials to create .env file from SSM Parameters .');
    console.log('This script will use the following options:');
    console.log(`- Account: ${stsResponse.Account}`);
    console.log(`- Region: ${region ? region : 'default'}`);
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
  const serviceEnvs = await getServiceParameters(environment, serviceName, region);

  if (!hidePrompt && serviceEnvs.length == 0) {
    const answer = readline.question('Could not find parameters for this service.\nAre you sure you want to overwrite .env file? (y/n) ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Exiting...');
      process.exit(0);
    }
  }

  if (dryRun) {
    console.log(`\n# dry run: ${serviceName} at environment: ${environment} will have the following parameters:`);
    console.log(serviceEnvs.map(envParam => `${envParam.envName}="${envParam.value}"`).join("\n"));
  } else {
    // save to .env file
    fs.writeFileSync(
      path, 
      serviceEnvs.map(envParam => `${envParam.envName}="${envParam.value}"`).join("\n"));
    console.log(`\n# saved parameters to ${path}`);
  }
}