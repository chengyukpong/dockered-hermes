## ADDED Requirements

### Requirement: Validate agent name
The system SHALL validate that the agent name contains only alphanumeric characters and hyphens. The system SHALL reject names that match an existing container.

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
The system SHALL create a named Podman volume `hermes-data-<name>` for the agent's persistent data, mounted at `/opt/data` in the container.

#### Scenario: Fresh agent volume creation
- **WHEN** setup runs with a valid unique name
- **THEN** the system runs `podman volume create hermes-data-<name>` and uses it as the data volume for the container

### Requirement: Inject configuration files into container
The system SHALL write `.env` and `SOUL.md` to a temporary staging directory, then inject them into the running container's `/opt/data/` via `podman cp` after the container is started.

#### Scenario: Files injected into container
- **WHEN** the container is started and the merged profile is resolved
- **THEN** the system writes `.env` and `SOUL.md` to a temp directory, runs `podman cp <file> hermes-<name>:/opt/data/` for each file, then cleans up the temp directory

### Requirement: Pull container image
The system SHALL pull `docker.io/nousresearch/hermes-agent:latest` before creating the container.

#### Scenario: Image not pulled yet
- **WHEN** the image is not available locally
- **THEN** the system runs `podman pull docker.io/nousresearch/hermes-agent:latest`

#### Scenario: Image already cached
- **WHEN** the image is already present locally
- **THEN** `podman pull` completes quickly (no error, layers skipped)

### Requirement: Create container with resource limits and ports
The system SHALL create a Podman container named `hermes-<name>` with CPU, memory, and disk limits from the merged config, port mappings for gateway and dashboard, a named volume `hermes-data-<name>` mounted to `/opt/data`, and a command of `sleep infinity`.

#### Scenario: Container created with correct settings
- **WHEN** setup creates the container for agent "my-agent" with config `{ cpu: "1", memory: "1g", disk: "5g", gateway_port: 8642, dashboard_port: 9119 }`
- **THEN** the system runs `podman create` with `--name hermes-my-agent --cpu 1 --memory 1g --disk-size 5g -p 8642:<container_port> -p 9119:<container_port> -v hermes-data-my-agent:/opt/data` and command `sleep infinity`

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
