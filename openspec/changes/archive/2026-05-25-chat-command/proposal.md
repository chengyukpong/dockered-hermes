## Why

After an agent is created via `setup`, users need a way to interact with it. The `chat` command starts an interactive TUI session with a named agent by attaching to the running container via `podman exec -it`. Without it, agents are provisioned but unusable.

## What Changes

- Add `chat` CLI command via Commander, accepting `<name>` argument
- Start the container if it is stopped (agents are stopped after `setup`)
- Execute `podman exec -it hermes-<name> hermes` with stdio inherited for interactive TUI
- Container keeps running after user exits the chat session
- Validate agent exists before attempting to start/exec

## Capabilities

### New Capabilities
- `interactive-chat`: Start a container if stopped, then attach an interactive terminal session to a running hermes agent via `podman exec -it`

### Modified Capabilities
- `container-management`: Add `listContainers()` function to support agent existence checks

## Impact

- **New files**: `src/commands/chat.js`
- **Modified files**: `src/cli.js` (register chat command), `src/lib/container.js` (add `listContainers`)
- **Dependencies**: None new — reuses `container.js` from `setup-command`
