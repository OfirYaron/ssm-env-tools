# SSM-Env-Tools

SSM-Env-Tools is a Node.js command-line utility designed to streamline the management of AWS Systems Manager (SSM) parameters, specifically catering to the conventions `/{env}/{service}/{env_name}`. This tool simplifies the import and export of environment variables between your local development environment and AWS SSM.

## Installation

Ensure you have Node.js installed on your machine. Then, install the utility using npm:

```bash
npm install -g ssm-env-tools
```

## Usage

### Pull: Retrieve .env from SSM

Use the `pull` command to retrieve environment variables from AWS SSM and save them to a local `.env` file.

```bash
ssm-env-tools pull --env=<environment> --service=<service> --path=<local-path-with-filename> [--dry-run] [--skip-prompt]
```

- `<environment>`: Environment name.
- `<service>`: Service name.
- `<local-path-with-filename>`: Local path, including the file name, where the `.env` file will be saved.

### Push: Update SSM with .env

Use the `push` command to update AWS SSM with environment variables from a local `.env` file.

```bash
ssm-env-tools push --path=<local-path-with-filename> --env=<environment> --service=<service> [--dry-run] [--skip-prompt]
```

- `<local-path-with-filename>`: Local path, including the file name, to the `.env` file.
- `<environment>`: Environment name.
- `<service>`: Service name.

## Examples

### Pull .env from SSM

```bash
ssm-env-tools pull --env='stage' --service='website' --path='.env'
```

### Push .env to SSM

```bash
ssm-env-tools push --path='.env' --env='stage' --service='website'
```

## Options

- `--version`: Display the version number.
- `-h, --help`: Display help information.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.