## ADDED Requirements

### Requirement: Validate agent name
The system SHALL validate that the agent name contains only alphanumeric characters and hyphens. The system SHALL reject names that match an existing container (checked via `podman inspect`).

#### Scenario: Valid unique name
- **WHEN** the agent name is "my-agent-1" and no container named "hermes-my-agent-1" exists
- **THEN** the system accepts the name and proceeds

#### Scenario: Invalid characters in name
- **WHEN** the agent name is "my agent!" or contains underscores or special characters
- **THEN** the system throws an error "Agent name must be alphanumeric with hyphens only"

#### Scenario: Agent name collision
- **WHEN** the agent name is "existing-agent" and a container named "hermes-existing-agent" already exists
- **THEN** the system throws an error "Agent '<name>' already exists (container hermes-<name> found)"

### Requirement: Create Podman volume for agent data
The system SHALL create a named Podman volume `hermes-data-<name>` for the agent's persistent data, mounted at `/opt/data` in the container. Volume creation SHALL be idempotent — if the volume already exists, the setup SHALL succeed without error.

#### Scenario: Fresh agent volume creation
- **WHEN** setup runs with a valid unique name
- **THEN** the system runs `podman volume create hermes-data-<name>` and uses it as the data volume for the container

#### Scenario: Volume already exists
- **WHEN** setup runs and the volume `hermes-data-<name>` already exists from a previous failed attempt
- **THEN** the "already exists" error is silently ignored and setup proceeds

### Requirement: Pass environment variables via --env-file
The system SHALL write all merged environment variables to a temporary `.env` file and pass it to `podman create` via `--env-file`, making the variables available as actual container environment variables.

#### Scenario: Environment variables set in container
- **WHEN** setup creates the container with an env file
- **THEN** the env vars are available inside the container via `env` and `process.env`

### Requirement: Copy .env file into container data directory
The system SHALL copy the `.env` file into `/opt/data/.env` inside the container via `podman cp`, so hermes-agent can read it at runtime from its data directory.

#### Scenario: .env available at /opt/data/.env
- **WHEN** the container is started and files are injected
- **THEN** `/opt/data/.env` contains all merged environment variables

### Requirement: Copy SOUL.md into container
The system SHALL copy the resolved `SOUL.md` file into `/opt/data/SOUL.md` inside the container via `podman cp`.

#### Scenario: SOUL.md available at /opt/data/SOUL.md
- **WHEN** the container is started and files are injected
- **THEN** `/opt/data/SOUL.md` contains the soul file from the merged profile

### Requirement: Patch hermes config.yaml for model and provider
The system SHALL patch `/opt/data/config.yaml` inside the running container to set `model.default`, `provider`, and `base_url` based on the `model`, `provider`, and `base_url` fields from the resolved profile. When a non-auto provider is specified, the `base_url` line SHALL be commented out so hermes auto-detects the correct endpoint.

#### Scenario: Model and provider configured
- **WHEN** the resolved profile has `model: "deepseek-v4-flash"` and `provider: "deepseek"`
- **THEN** the system patches `config.yaml` to set `default: "deepseek-v4-flash"`, `provider: "deepseek"`, and comments out `base_url`

#### Scenario: No model specified in profile
- **WHEN** the resolved profile has no `model` field
- **THEN** the system skips config.yaml patching

### Requirement: Pull container image
The system SHALL pull `docker.io/nousresearch/hermes-agent:latest` before creating the container.

#### Scenario: Image not pulled yet
- **WHEN** the image is not available locally
- **THEN** the system runs `podman pull docker.io/nousresearch/hermes-agent:latest`

#### Scenario: Image already cached
- **WHEN** the image is already present locally
- **THEN** `podman pull` completes quickly (no error, layers skipped)

### Requirement: Create container with resource limits and ports
The system SHALL create a Podman container named `hermes-<name>` with CPU (`--cpus`) and memory (`--memory`) limits from the merged config, port mappings for gateway and dashboard, a named volume `hermes-data-<name>` mounted to `/opt/data`, and a command of `sleep infinity`. Disk size (`--storage-opt size=`) is included only if the backing filesystem is XFS.

#### Scenario: Container created with correct settings on XFS
- **WHEN** setup creates the container for agent "my-agent" with config `{ cpu: "1", memory: "1g", disk: "5g", gateway_port: 8642, dashboard_port: 9119 }` on XFS
- **THEN** the system runs `podman create` with `--name hermes-my-agent --cpus 1 --memory 1g --storage-opt size=5g -p 8642:8642 -p 9119:9119 -v hermes-data-my-agent:/opt/data` and command `sleep infinity`

#### Scenario: Container created without disk limit on non-XFS
- **WHEN** setup creates the container on a non-XFS filesystem
- **THEN** `--storage-opt size=` is omitted and a warning is printed

### Requirement: Start then stop container
The system SHALL start the container (to allow the hermes entrypoint to bootstrap `config.yaml` and `SOUL.md`), then stop it so the agent is ready but not consuming resources until `chat` is invoked.

#### Scenario: Container starts and stops successfully
- **WHEN** the container has been created
- **THEN** the system runs `podman start hermes-<name>`, waits for completion, then runs `podman stop hermes-<name>`

### Requirement: Check podman availability
The system SHALL verify the `podman` binary is available before any podman operations.

#### Scenario: Podman is installed
- **WHEN** `podman` binary is found in PATH
- **THEN** setup proceeds normally

#### Scenario: Podman not installed
- **WHEN** `podman` binary is not found
- **THEN** the system throws an error "podman not found. Install: https://podman.io/getting-started/installation"
