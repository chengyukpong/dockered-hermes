## ADDED Requirements

### Requirement: Validate agent exists before delete
The system SHALL check that a container named `hermes-<name>` exists before prompting for deletion.

#### Scenario: Agent exists
- **WHEN** `delete my-agent` is called and container `hermes-my-agent` exists
- **THEN** the system proceeds to the confirmation prompt

#### Scenario: Agent does not exist
- **WHEN** `delete nonexistent` is called and no container `hermes-nonexistent` exists
- **THEN** the system throws an error "Agent 'nonexistent' not found"

### Requirement: Prompt for confirmation
The system SHALL prompt the user with "Delete agent '<name>' and all its data? (y/N)" and require an explicit `y` or `Y` to proceed. Any other input (including empty) SHALL cancel the operation.

#### Scenario: User confirms deletion
- **WHEN** the user types `y` or `Y` at the confirmation prompt
- **THEN** the system proceeds with deletion

#### Scenario: User declines deletion
- **WHEN** the user types anything other than `y` or `Y` (including pressing Enter with no input)
- **THEN** the system prints "Cancelled" and exits without making changes

### Requirement: Remove container
The system SHALL force-remove the agent's container using `podman rm -f`, which stops a running container before removing it.

#### Scenario: Container is running
- **WHEN** the agent's container is running and user confirms deletion
- **THEN** the system runs `podman rm -f hermes-<name>`, stopping and removing the container

#### Scenario: Container is stopped
- **WHEN** the agent's container is stopped and user confirms deletion
- **THEN** the system runs `podman rm -f hermes-<name>`, removing the stopped container

### Requirement: Remove data volume
The system SHALL remove the agent's named data volume `hermes-data-<name>` using `podman volume rm` after the container is removed.

#### Scenario: Volume removed successfully
- **WHEN** the container has been removed and the volume `hermes-data-<name>` exists
- **THEN** the system runs `podman volume rm hermes-data-<name>` and the volume is deleted

#### Scenario: Volume removal fails
- **WHEN** `podman volume rm` returns an error
- **THEN** the system prints a warning that the volume may need manual cleanup but does not fail the entire command

### Requirement: Print success message
The system SHALL print a confirmation message after successful deletion.

#### Scenario: Successful deletion
- **WHEN** both container and volume are removed
- **THEN** the system prints "Agent '<name>' deleted" with all data removed
