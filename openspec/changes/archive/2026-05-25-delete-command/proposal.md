## Why

Users need to clean up agents they no longer need — removing the container, its data volume, and all associated state. The `delete` command provides a safe, confirmed teardown of a named agent.

## What Changes

- Add `delete` CLI command via Commander, accepting `<name>` argument
- Prompt for confirmation (`y/N`) before proceeding
- Force-remove the container (`podman rm -f`) — stops if running, then removes
- Remove the named volume (`podman volume rm hermes-data-<name>`)
- Validate agent exists before attempting deletion

## Capabilities

### New Capabilities
- `agent-deletion`: Confirm with user, then remove a named agent's container and its data volume entirely

### Modified Capabilities
- `container-management`: Add `listContainers()` and `removeVolume()` if not already present

## Impact

- **New files**: `src/commands/delete.js`
- **Modified files**: `src/cli.js` (register delete command), `src/lib/container.js` (add `removeVolume` if not present)
- **Destructive**: Removes all agent data — confirmation prompt is mandatory
