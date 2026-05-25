## Context

The `chat` command is the primary user-facing interaction point. After `setup` provisions an agent (container stopped, ready to go), `chat` brings it to life by starting the container and attaching an interactive terminal session. The command is simple — start if stopped, then exec.

## Goals / Non-Goals

**Goals:**
- Provide seamless interactive TUI access to a hermes agent
- Auto-start stopped containers so users don't need to manage container lifecycle manually
- Keep the container running after chat exits (so subsequent `chat` invocations are fast)

**Non-Goals:**
- Session history or persistence (handled by hermes-agent internally)
- Multiple simultaneous sessions (out of scope for this tool)
- Any configuration or profile resolution (agent is already set up)

## Decisions

### 1. Spawn with stdio inherit for interactive TTY
**Choice**: Use `child_process.spawn` with `{ stdio: 'inherit' }` for the `podman exec -it` call.
**Rationale**: The hermes TUI requires a real TTY. `execSync` buffers output and cannot provide interactive terminal access. Spawn with stdio inherit passes through the user's terminal directly.

### 2. Auto-start before exec
**Choice**: Always call `startContainer()` before `execInteractive()`. If already running, `podman start` is a no-op.
**Rationale**: Simpler than checking state first. Eliminates a podman round-trip for the common case (container stopped after setup).

### 3. Agent existence check via container list
**Choice**: Validate the agent exists by checking for a container named `hermes-<name>` via `listContainers()`.
**Rationale**: Avoids a cryptic podman error when the user typos an agent name.

## Risks / Trade-offs

- **[Container left running after crash]** → If the Node process crashes during exec, the container stays running. This is intentional — matches the expected lifecycle (container runs until explicitly deleted).
- **[No TTY detection]** → If run in a non-interactive context (e.g., piped), `podman exec -it` will fail. Could add a TTY check in the future.
