## Why

The project needs its primary command — `setup` — to enable users to create new hermes agent sandboxes from profile definitions. Without it, there is no way to provision agents. This is the foundational command that all other commands (`chat`, `list`, `delete`) depend on, since they operate on agents created by `setup`.

## What Changes

- Add `setup` CLI command via Commander, accepting `<name>` and `--profile <name>` arguments
- Implement profile loading and validation from `profiles.yaml`
- Implement defaults + profile merge logic (deep merge for `env`/`config`, replace for `soul`)
- Implement `${VAR}` interpolation in env values with host env → `./.env` fallback
- Implement Podman named volume creation for agent data
- Inject `.env` and `SOUL.md` into the container via `podman cp` after start
- Implement Podman image pull, container creation with resource limits and port mappings, start, inject files, then stop
- Add agent name validation (alphanumeric + hyphens, no collisions)
- Add graceful error handling for all failure modes (missing profiles.yaml, unknown profile, unresolved vars, missing soul, podman not found, name collision)

## Capabilities

### New Capabilities
- `profile-loading`: Parse and validate `profiles.yaml`, resolve a named profile by merging defaults, interpolate `${VAR}` references in env values, and resolve/validate soul file paths
- `agent-setup`: Orchestrate the full setup pipeline — validate agent name, create Podman volume, pull image, create/start container, inject `.env` and `SOUL.md` via `podman cp`, stop container
- `container-management`: Low-level Podman CLI wrappers for pulling images, creating containers with resource limits and port mappings, starting, stopping, and inspecting containers

### Modified Capabilities
<!-- No existing capabilities to modify — this is greenfield -->

## Impact

- **New files**: `src/cli.js`, `src/commands/setup.js`, `src/lib/config.js`, `src/lib/profiles.js`, `src/lib/container.js`, `package.json`
- **Dependencies**: `commander`, `js-yaml`, `dotenv`, `chalk`
- **System requirements**: Podman must be installed on the host
- **Disk**: Creates a Podman named volume per agent; pulls container image (~1GB)
- **Agent discovery**: Listed via container names (not host directories)
