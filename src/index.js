#!/usr/bin/env node

const yargs = require("yargs/yargs");
const env_to_ssm = require("./env-to-ssm.js");
const ssm_to_env = require("./ssm-to-env.js");

yargs(process.argv.slice(2))
  .usage("\nUsage: $0 [cmd] <args>")
  .alias("h", "help")
  .demandCommand(1)
  .command(
    "pull",
    "- Pull .env from SSM",
    {
      env: {
        type: "string",
        demandOption: true,
        describe: "Environment name (stage/prod)",
      },
      service: {
        type: "string",
        demandOption: true,
        describe: "Service Name (website/backend)",
      },
      path: {
        type: "string",
        describe: "Output file path (default: .env.{env})",
      },
    },
    async (argv) => {
      // console.log("ssm-pull:", argv);
      await ssm_to_env(argv.path, argv.env, argv.service);
    }
  )
  .example("$0 pull --env='stage' --service='website' --path='.env'")
  .command(
    "push",
    "- Push .env to SSM",
    {
      path: {
        type: "string",
        demandOption: true,
        describe: "input file path",
      },
      env: {
        type: "string",
        demandOption: true,
        describe: "Environment name (stage/prod)",
      },
      service: {
        type: "string",
        demandOption: true,
        describe: "Service Name (website/backend)",
      },
      dryrun: {
        type: "bool",
        demandOption: false,
        describe: "Dryrun invocation (default: false)",
      },
    },
    function (argv) {
      const args = { 
        ...{ path: `.env.${argv.env}`, dryrun: false }, 
        ...argv };
      console.log("env-to-ssm:", args);
      env_to_ssm(args.path, args.env, args.service, args.dryrun);
    }
  )
  .example("$0 push --path='.env' --env='stage' --service='website'")
  .parse();