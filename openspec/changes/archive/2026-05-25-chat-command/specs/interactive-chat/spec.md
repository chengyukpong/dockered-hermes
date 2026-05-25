## ADDED Requirements

### Requirement: Validate agent exists before chat
The system SHALL check that a container named `hermes-<name>` exists before attempting to start or exec. If no such container exists, the system SHALL throw an error.

#### Scenario: Agent exists
- **WHEN** `chat my-agent` is called and container `hermes-my-agent` exists
- **THEN** the system proceeds to start and exec

#### Scenario: Agent does not exist
- **WHEN** `chat nonexistent` is called and no container `hermes-nonexistent` exists
- **THEN** the system throws an error "Agent 'nonexistent' not found"

### Requirement: Start container if stopped
The system SHALL start the agent's container before attaching. If the container is already running, `podman start` is a no-op and no error occurs.

#### Scenario: Container is stopped
- **WHEN** the container `hermes-<name>` exists but is in a stopped state
- **THEN** the system runs `podman start hermes-<name>` before exec

#### Scenario: Container is already running
- **WHEN** the container `hermes-<name>` is already in a running state
- **THEN** `podman start` completes without error and the system proceeds to exec

### Requirement: Attach interactive terminal session
The system SHALL execute `podman exec -it hermes-<name> hermes` with stdio inherited from the parent process, providing an interactive TUI session.

#### Scenario: Successful interactive session
- **WHEN** the container is running and the user's terminal is interactive
- **THEN** the system spawns `podman exec -it hermes-<name> hermes` with `{ stdio: 'inherit' }` and waits for it to exit

#### Scenario: User exits chat
- **WHEN** the user exits the hermes TUI (Ctrl+C, exit command, etc.)
- **THEN** the spawn process completes and the chat command returns. The container remains running.

### Requirement: Container stays running after chat exits
The system SHALL NOT stop the container when the chat session ends. The container remains in a running state for faster subsequent `chat` invocations.

#### Scenario: Container running after exit
- **WHEN** the chat session ends and the command returns
- **THEN** the container `hermes-<name>` is still in a running state
