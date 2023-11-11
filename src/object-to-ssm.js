const { SSMClient, PutParameterCommand } = require('@aws-sdk/client-ssm');

const PER_SECOND_RATE_LIMIT = 5;
const DEFAULT_OPTIONS = {
  verbose: false,
  dryRun: false,
  region: 'eu-central-1',
  environment: 'stage',
  serviceName: 'acme'
}

/**
 * @options optional, 
 * DEFAULT_OPTIONS = {
 *    verbose: false, dryRun: false, region: 'eu-central-1', 
 *    environment: 'stage', serviceName: 'acme'
 * }
 * @jsonObject JSON object to convert to SSM Parameters
 */
async function createSSMParametersFromJSON(jsonObject, options = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const client = new SSMClient({
    apiVersion: '2014-11-06',
  });
  const params = [];

  for (const key in jsonObject) {
    params.push({
      Name: `/${mergedOptions.environment}/${mergedOptions.serviceName}/${key}`,
      Value: jsonObject[key],
      Type: (/username|password|token|secret|api_key/i.test(key)) ? 
        'SecureString' : 'String',
      Overwrite: true
    });

    if (mergedOptions.verbose) {
      console.log(`Adding SSM Parameter: ${params[params.length-1].Name} (Type: ${params[params.length-1].Type})`);
    }
  }

  if (params.length > 0) {
    try {
      for (const param of params) {
        // if value is empty, skip it
        if (param.Value === '') {
          continue;
        }

        if (mergedOptions.verbose) {
          console.log(`Creating SSM Parameter: ${param.Name} (Type: ${param.Type})`);
        }
        
        if (!mergedOptions.dryRun) {
          const command = new PutParameterCommand(param);
          const result = await client.send(command);

          // sleep to avoid throttling
          await new Promise(resolve => setTimeout(resolve, 1000/PER_SECOND_RATE_LIMIT));
        } else {
          console.log(`Would create SSM Parameter: ${param.Name} (Type: ${param.Type})`);
        }
      }
      console.log('SSM Parameters created successfully.');
    } catch (err) {
      console.error('Error creating SSM Parameters:', err);
    }
  } else {
    console.log('No SSM Parameters to create.');
  }
}

module.exports = createSSMParametersFromJSON;