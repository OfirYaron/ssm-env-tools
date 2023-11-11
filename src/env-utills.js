const dotenv = require('dotenv');
const fs = require('fs');

function env2Object(envPath) {
  // Check if a .env file path is provided as a command-line argument
  if (!envPath) {
    console.error('Please provide the path to the .env file as a command-line argument.');
    process.exit(1);
  }

  // Check if the .env file exists
  if (!fs.existsSync(envPath)) {
    console.error(`The specified .env file does not exist: ${envPath}`);
    process.exit(1);
  }

  // Load the .env file
  const envFileContent = fs.readFileSync(envPath, 'utf8');

  // Load the .env file content into process.env using dotenv.parse
  const envVariables = dotenv.parse(envFileContent);

  // Convert envVariables into a JSON object
  const envObject = {};
  for (const key in envVariables) {
    envObject[key] = envVariables[key];
  }

  return envObject;
}

module.exports = env2Object;