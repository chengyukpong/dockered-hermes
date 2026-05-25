## Context

The `delete` command is the teardown counterpart to `setup`. It removes an agent entirely — container and data volume. It's intentionally destructive and requires explicit user confirmation.

## Goals / Non-Goals

**Goals:**
- Remove all traces of an agent (container + volume)
- Require explicit confirmation to prevent accidental deletion
- Handle both running and stopped containers gracefully

**Non-Goals:**
- Selective deletion (e.g., keep volume, remove only container)
- Backup before delete (user responsibility)
- Batch deletion of multiple agents

## Decisions

### 1. Confirmation prompt with readline
**Choice**: Use Node's built-in `readline` module for the `y/N` confirmation prompt.
**Rationale**: No additional dependency needed. The prompt is a single yes/no question — readline handles it cleanly.

### 2. Force-remove container first, then volume
**Choice**: `podman rm -f` (stops + removes container), then `podman volume rm`.
**Rationale**: Podman won't remove a volume that's still referenced by a container (even a stopped one). Force-removing the container first ensures the volume can be cleaned up.

### 3. Default to "no" on confirmation
**Choice**: Confirmation requires an explicit `y` or `Y`. Any other input (including empty/enter) cancels.
**Rationale**: Destructive operation — the safe default is to not delete.

## Risks / Trade-offs

- **[Data loss]** → Mitigated by confirmation prompt. Volume data is not recoverable after `podman volume rm`.
- **[Orphaned volumes]** → If `podman volume rm` fails after container removal, the volume is orphaned. Could add a retry or warning, but edge case for initial implementation.
