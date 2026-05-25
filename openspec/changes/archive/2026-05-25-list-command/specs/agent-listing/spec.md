## ADDED Requirements

### Requirement: Discover all managed agents
The system SHALL list all Podman containers whose names start with `hermes-` to discover managed agents.

#### Scenario: Agents exist
- **WHEN** `list` is called and containers `hermes-agent-a` and `hermes-agent-b` exist
- **THEN** the system returns both agents with their container status

#### Scenario: No agents exist
- **WHEN** `list` is called and no containers with `hermes-` prefix exist
- **THEN** the system prints "No agents found" and exits successfully

### Requirement: Display agent status table
The system SHALL print a formatted table with columns: NAME, STATUS. Status SHALL be color-coded: green for running, gray/yellow for other states.

#### Scenario: Multiple agents with mixed statuses
- **WHEN** agents exist with varying statuses (running, stopped, exited)
- **THEN** the system prints a table with one row per agent, status column showing the container state, running agents highlighted in green

#### Scenario: Table formatting
- **WHEN** the table is printed
- **THEN** columns are aligned, headers are present, and the output is human-readable
