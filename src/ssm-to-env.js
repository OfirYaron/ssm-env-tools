const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const fs = require('fs');

const client = new SSMClient({
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

module.exports = async (path, environment, serviceName) => {
  console.log(`# getting parameters for ${serviceName} at environment: ${environment}`);
  const serviceEnvs = await getServiceParameters(environment, serviceName);

  // save to .env file
  fs.writeFileSync(
    path, 
    serviceEnvs.map(envParam => `${envParam.envName}="${envParam.value}"`).join("\n"));
}