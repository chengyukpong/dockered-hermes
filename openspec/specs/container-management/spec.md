## ADDED Requirements

### Requirement: Pull image
The system SHALL provide a function that executes `podman pull` for the hermes-agent image and returns stdout.

#### Scenario: Successful pull
- **WHEN** `pullImage()` is called
- **THEN** it executes `podman pull docker.io/nousresearch/hermes-agent:latest` synchronously with stdio inherited and returns the output

#### Scenario: Pull fails
- **WHEN** `pullImage()` is called and podman returns a non-zero exit code
- **THEN** it throws an error with the stderr output from podman

### Requirement: Create container
The system SHALL provide a function that creates a Podman container with specified name, volume name, resource config, and optional env file path. The container uses a named Podman volume mounted at `/opt/data`. CPU is set via `--cpus`, memory via `--memory`. Disk size is set via `--storage-opt size=` only if the backing filesystem is XFS; otherwise a warning is printed and the flag is skipped.

#### Scenario: Successful create with XFS backing filesystem
- **WHEN** `createContainer(name, volumeName, config, envFilePath)` is called and the backing filesystem is XFS
- **THEN** it executes `podman create` with `--name hermes-<name>`, `--cpus`, `--memory`, `--storage-opt size=`, port mappings, `--env-file`, `-v hermes-data-<name>:/opt/data`, image, and `sleep infinity` command

#### Scenario: Successful create with non-XFS backing filesystem
- **WHEN** `createContainer(name, volumeName, config, envFilePath)` is called and the backing filesystem is not XFS
- **THEN** it prints a warning about disk size being skipped, and executes `podman create` without `--storage-opt`

#### Scenario: Create fails due to name conflict
- **WHEN** a container with the same name already exists
- **THEN** it throws the error from podman

### Requirement: Start container
The system SHALL provide a function that starts a named container.

#### Scenario: Successful start
- **WHEN** `startContainer(name)` is called
- **THEN** it executes `podman start hermes-<name>` synchronously

### Requirement: Stop container
The system SHALL provide a function that stops a named container.

#### Scenario: Successful stop
- **WHEN** `stopContainer(name)` is called
- **THEN** it executes `podman stop hermes-<name>` synchronously

### Requirement: Create volume
The system SHALL provide a function that creates a named Podman volume. If the volume already exists, the function SHALL silently succeed without error.

#### Scenario: Successful volume creation
- **WHEN** `createVolume(volumeName)` is called and the volume does not exist
- **THEN** it executes `podman volume create <volumeName>` synchronously

#### Scenario: Volume already exists
- **WHEN** `createVolume(volumeName)` is called and the volume already exists
- **THEN** the function returns without error, suppressing the "already exists" message

### Requirement: Remove volume
The system SHALL provide a function that removes a named Podman volume. If removal fails, it SHALL print a warning but not throw.

#### Scenario: Successful volume removal
- **WHEN** `removeVolume(volumeName)` is called
- **THEN** it executes `podman volume rm <volumeName>` synchronously

#### Scenario: Volume removal fails
- **WHEN** `podman volume rm` returns an error
- **THEN** it prints a warning with the error message

### Requirement: Copy files into container
The system SHALL provide a function that copies a local file into a running container.

#### Scenario: Successful copy
- **WHEN** `copyIntoContainer(name, localPath, containerPath)` is called
- **THEN** it executes `podman cp <localPath> hermes-<name>:<containerPath>` synchronously

### Requirement: Remove container
The system SHALL provide a function that force-removes a named container (stop + remove).

#### Scenario: Successful removal
- **WHEN** `removeContainer(name)` is called
- **THEN** it executes `podman rm -f hermes-<name>` synchronously

### Requirement: Inspect container
The system SHALL provide a function that returns parsed JSON from `podman inspect` for a named container.

#### Scenario: Container exists
- **WHEN** `inspectContainer(name)` is called and the container exists
- **THEN** it returns the parsed JSON array from `podman inspect hermes-<name>`

#### Scenario: Container does not exist
- **WHEN** `inspectContainer(name)` is called and the container does not exist
- **THEN** it returns null

### Requirement: Check container running state
The system SHALL provide a function that returns whether a named container is currently running.

#### Scenario: Container is running
- **WHEN** `isRunning(name)` is called and the container state is "running"
- **THEN** it returns true

#### Scenario: Container is stopped
- **WHEN** `isRunning(name)` is called and the container exists but is not running
- **THEN** it returns false

#### Scenario: Container does not exist
- **WHEN** `isRunning(name)` is called and the container does not exist
- **THEN** it returns false

### Requirement: Container existence check
The system SHALL provide a function that checks if a container exists by using `podman inspect`. It SHALL NOT rely on `podman ps` filtering.

#### Scenario: Container exists
- **WHEN** `containerExists(name)` is called and `podman inspect hermes-<name>` succeeds
- **THEN** it returns true

#### Scenario: Container does not exist
- **WHEN** `containerExists(name)` is called and `podman inspect hermes-<name>` fails
- **THEN** it returns false

### Requirement: Interactive exec
The system SHALL provide a function that executes an interactive command inside a running container using `podman exec -it` with stdio inherited from the parent process. The function SHALL return the spawned ChildProcess object.

#### Scenario: Exec interactive command
- **WHEN** `execInteractive(name, cmd)` is called
- **THEN** it spawns `podman exec -it hermes-<name> <cmd>` with `{ stdio: 'inherit' }` and returns the ChildProcess

### Requirement: Execute command in container
The system SHALL provide a function that executes a command inside a running container synchronously via `podman exec`.

#### Scenario: Successful execution
- **WHEN** `execInContainer(name, cmd)` is called
- **THEN** it executes `podman exec hermes-<name> bash -c "<cmd>"` synchronously with stdio piped

### Requirement: Verify podman binary
The system SHALL provide a function that checks if the `podman` binary is available on the system.

#### Scenario: Podman available
- **WHEN** `checkPodman()` is called and `podman` is in PATH
- **THEN** it returns without error

#### Scenario: Podman not available
- **WHEN** `checkPodman()` is called and `podman` is not in PATH
- **THEN** it throws an error with install instructions

### Requirement: List containers
The system SHALL provide a function that lists all Podman containers whose names start with `hermes-`, returning their names, statuses, and states.

#### Scenario: Containers exist
- **WHEN** `listContainers()` is called and containers with `hermes-` prefix exist
- **THEN** it returns an array of objects with `name`, `status`, and `state` fields

#### Scenario: No containers or podman unavailable
- **WHEN** `listContainers()` is called and no containers exist or podman is unavailable
- **THEN** it returns an empty array
