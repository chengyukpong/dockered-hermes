## Context

`dockered-hermes` is a greenfield Node.js CLI tool. There is no existing code — this is the first command to be implemented. The project uses Podman (not Docker) as its container runtime and targets Linux environments. Each hermes agent runs as an isolated container with its own data volume, configuration, and personality (soul file).

Users define agent profiles in a `profiles.yaml` file in their working directory, specifying resource limits, environment variables, and soul file paths. The `setup` command reads this file, resolves a specific profile, and provisions a ready-to-use agent container.

## Goals / Non-Goals

**Goals:**
- Implement the complete `setup` command end-to-end as described in AGENTS.md and ARCHITECTURE.md
- Provide clean module boundaries: `config.js` (paths/validation), `profiles.js` (YAML/merge/interpolation), `container.js` (Podman wrappers)
- Handle all documented error conditions with user-friendly messages
- Support interactive `podman exec` via stdio inheritance for future `chat` command reuse

**Non-Goals:**
- Docker support (Podman only)
- Testing infrastructure setup (can be addressed in a separate change)
- Config file generation (`config.yaml` is bootstrapped by the hermes-agent entrypoint, not by us)
- Authentication or authorization for agent access

## Decisions

### 1. Commander.js for CLI framework
**Choice**: Use `commander` package for argument parsing and command registration.
**Rationale**: Well-established, minimal, and already specified as a dependency in ARCHITECTURE.md. Provides `.option()`, `.action()`, and `.command()` patterns that map cleanly to our command structure.

### 2. `child_process.execSync` for sync operations, `spawn` for interactive
**Choice**: Use `execSync` for podman pull/create/start/stop/inspect/rm. Use `spawn` with `{ stdio: 'inherit' }` for `podman exec -it`.
**Rationale**: Setup is a sequential pipeline — each step must complete before the next begins. `execSync` simplifies error handling and output capture. Only the `chat` command (future) needs interactive stdio, but we define the `spawn`-based `execInteractive` now for reuse.

### 3. Synchronous execution throughout setup
**Choice**: All setup operations are synchronous.
**Rationale**: The setup command is user-facing and sequential (pull → create → start → stop). No concurrency benefit. Sync code is simpler and easier to reason about for error handling.

### 4. Deep merge via manual recursion (no lodash)
**Choice**: Implement a small `deepMerge(target, source)` utility in `profiles.js`.
**Rationale**: Only `env` and `config` objects need deep merge — both are flat or one-level-deep string/number maps. Adding a dependency for this is overkill.

### 5. Podman-managed agent data (named volumes)
**Choice**: Use Podman named volumes (`hermes-data-<name>`) instead of host-side bind mounts. The setup command creates the volume, creates the container, starts it, injects `.env` and `SOUL.md` via `podman cp`, then stops the container. No host-side `~/.dockered-hermes/` directory is created or managed.
**Rationale**: Agent data lifecycle is fully managed by Podman — volume creation, data storage, and cleanup (`podman volume rm`) are all container-native. This avoids host filesystem pollution and ensures clean separation between the CLI tool and container state. Agent discovery uses `podman ps -a --filter name=hermes-` instead of directory listing.

### 6. chalk for terminal output
**Choice**: Use `chalk` for colored success/error/info messages.
**Rationale**: Specified in ARCHITECTURE.md. Provides clean API for green/red/yellow output without raw ANSI codes.

## Risks / Trade-offs

- **[Podman availability]** → Pre-flight check with `checkPodman()` before any podman operations. Clear error message with install URL.
- **[Port collisions across agents]** → No automatic port conflict detection in this change. Users are responsible for unique ports per profile. Could be added as a validation step in a future change.
- **[Large image pull on slow networks]** → No progress bar in initial implementation. `execSync` will block until pull completes. User sees podman's native pull output.
- **[`${VAR}` interpolation edge cases]** → Only top-level `${VAR}` patterns in string values are supported. Nested interpolation or defaults (`${VAR:-default}`) are not supported initially.
