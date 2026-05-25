## Context

The `list` command is a read-only diagnostic tool. Users run it to see what agents exist and whether they're running, stopped, or in a bad state. It discovers agents entirely through Podman — no host filesystem access needed.

## Goals / Non-Goals

**Goals:**
- Show all managed agents in a clear, scannable table
- Show container status (running, stopped, created, etc.)
- Zero configuration — works with no arguments

**Non-Goals:**
- Detailed agent info (env vars, profile used, etc.) — could be a future `inspect` command
- Filtering or sorting (YAGNI)
- Watching for status changes (could be a future `--watch` flag)

## Decisions

### 1. Discover agents via podman container names
**Choice**: Use `podman ps -a --filter name=hermes- --format json` to find all managed containers.
**Rationale**: With the volume-based model, there are no host directories to scan. Podman is the single source of truth for agent existence.

### 2. Table output with chalk
**Choice**: Print a formatted table with aligned columns using `chalk` for status coloring (green for running, red for stopped/exited).
**Rationale**: Consistent with the project's terminal-first approach. No additional dependencies needed — simple string padding suffices for a small table.

## Risks / Trade-offs

- **[No metadata about profiles or config]** → The table only shows container info. Users can't see which profile an agent was set up with. Could be addressed by storing metadata as container labels in a future change.
