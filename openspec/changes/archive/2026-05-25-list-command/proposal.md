## Why

Users need to see what agents exist and their current status (running, stopped, etc.) without remembering agent names or running raw podman commands. The `list` command provides a summary table of all managed agents.

## What Changes

- Add `list` CLI command via Commander, accepting no arguments
- Discover agents by listing Podman containers with `hermes-` name prefix
- For each agent, inspect container status (running, stopped, created, etc.)
- Print a formatted table: `NAME | STATUS | IMAGE`

## Capabilities

### New Capabilities
- `agent-listing`: Discover all managed agents via Podman container names and display their status in a formatted table

### Modified Capabilities
- `container-management`: Add `listContainers()` function to support agent discovery

## Impact

- **New files**: `src/commands/list.js`
- **Modified files**: `src/cli.js` (register list command), `src/lib/container.js` (add `listContainers`)
- **Dependencies**: None new — reuses `container.js`
