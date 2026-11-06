const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const fs = require('node:fs');

// Stubs AWS and the prompt so these tests use no credentials or network, and
// replaces fs.writeFileSync so no .env file is ever written.
let parameters;
let answers;
let prompts;
let writes;

class Client {
  async send(command) {
    return command.input ? { Parameters: parameters } : { Account: '000000000000' };
  }
}

class Command {
  constructor(input) {
    this.input = input;
  }
}

const stubs = {
  '@aws-sdk/client-ssm': { SSMClient: Client, GetParametersByPathCommand: Command },
  '@aws-sdk/client-sts': { STSClient: Client, GetCallerIdentityCommand: class {} },
  'readline-sync': {
    question: (question) => {
      prompts.push(question);
      return answers.shift();
    },
  },
};

const originalLoad = Module._load;
Module._load = function load(request, ...rest) {
  return stubs[request] || originalLoad.call(this, request, ...rest);
};
const ssmToEnv = require('../src/ssm-to-env.js');
// The stubs are only needed while the module under test loads its dependencies.
Module._load = originalLoad;

class Exit extends Error {
  constructor(code) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

beforeEach(() => {
  parameters = [];
  answers = [];
  prompts = [];
  writes = [];
  mock.method(fs, 'writeFileSync', (path, content) => writes.push({ path, content }));
  mock.method(process, 'exit', (code) => {
    throw new Exit(code);
  });
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
  mock.method(process.stdout, 'write', () => true);
});

afterEach(() => mock.restoreAll());

test('skip-prompt with zero parameters exits 1 and leaves the file alone', async () => {
  await assert.rejects(ssmToEnv('.env', 'stage', 'web', false, true), { code: 1 });
  assert.deepStrictEqual(writes, []);
  assert.deepStrictEqual(prompts, []);
});

test('skip-prompt with parameters writes the file', async () => {
  parameters = [{ Name: '/stage/web/FOO', Value: 'bar' }];
  await ssmToEnv('.env', 'stage', 'web', false, true);
  assert.deepStrictEqual(writes, [{ path: '.env', content: 'FOO="bar"' }]);
});

test('skip-prompt dry run with zero parameters neither fails nor writes', async () => {
  await ssmToEnv('.env', 'stage', 'web', true, true);
  assert.deepStrictEqual(writes, []);
});

test('prompted run with zero parameters asks, and "n" exits without writing', async () => {
  answers = ['y', 'n'];
  await assert.rejects(ssmToEnv('.env', 'stage', 'web', false, false), { code: 0 });
  assert.strictEqual(prompts.length, 2);
  assert.match(prompts[1], /Could not find parameters/);
  assert.deepStrictEqual(writes, []);
});

test('prompted run with zero parameters still overwrites when confirmed', async () => {
  answers = ['y', 'y'];
  await ssmToEnv('.env', 'stage', 'web', false, false);
  assert.deepStrictEqual(writes, [{ path: '.env', content: '' }]);
});
