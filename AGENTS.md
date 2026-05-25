# AGENTS.md — dockered-hermes

## Project Overview

`dockered-hermes` is a Node.js CLI tool for managing multiple isolated Hermes Agent instances using Podman containers. Each agent runs in its own sandboxed container with its own Podman named volume, configuration, and personality.

## Commands

### `dockered-hermes setup <name>`

Create a new hermes agent sandbox from a profile defined in `profiles.yaml`.

Steps:
1. Validate `profiles.yaml` exists in cwd
2. Parse and validate `profiles.yaml` (both `defaults` and `profiles` sections must exist)
3. Resolve profile (use `--profile` flag, required)
4. Merge `defaults` + profile:
   - `env`: deep merge, profile values override defaults
   - `config`: deep merge, profile values override defaults
   - `soul`: profile replaces default entirely
   - `model`, `provider`, `base_url`: profile overrides defaults
5. Interpolate `${VAR}` in env values (resolution order: host environment → `./.env` → throw error)
6. Validate soul file path exists
7. Pull `docker.io/nousresearch/hermes-agent:latest`
8. Create Podman named volume `hermes-data-<name>` (idempotent, ignores "already exists")
9. Create container with `--env-file` (passes env vars as container environment), `--cpus`, `--memory`, port mappings, named volume mount at `/opt/data`, and `sleep infinity`
10. Start container (entrypoint bootstraps config.yaml, etc.)
11. Copy `SOUL.md` and `.env` into `/opt/data/` via `podman cp`
12. Patch `/opt/data/config.yaml` to set `model.default`, `provider`, and comment out `base_url` (so hermes auto-detects the endpoint)
13. Stop container (agent is ready, not running until `chat` is invoked)

Options:
- `--profile <name>` — profile to use (required)

Disk size (`--storage-opt size=`) is only applied when the backing filesystem is XFS. On other filesystems (e.g. ext4), a warning is printed and the flag is skipped.

### `dockered-hermes chat <name>`

Start an interactive chat session with a named agent.

Steps:
1. Validate agent exists via `podman inspect`
2. Start container if stopped
3. Execute `podman exec -it hermes-<name> /opt/hermes/.venv/bin/hermes` (interactive TUI)
4. Container keeps running after user exits chat

### `dockered-hermes list`

List all managed agents and their container status.

Steps:
1. List containers via `podman ps -a --filter name=hermes-`
2. Print table: `NAME | STATUS` with chalk coloring (green for running, gray for others)

### `dockered-hermes delete <name>`

Remove an agent entirely.

Steps:
1. Prompt for confirmation (`y/N`, default no)
2. `podman rm -f hermes-<name>` (stop + remove container)
3. `podman volume rm hermes-data-<name>` (remove data volume)

## Validation Rules

- Agent names: alphanumeric and hyphens only
- `profiles.yaml` must exist in cwd before any command
- `defaults` section is mandatory in `profiles.yaml`
- `profiles` section must contain at least one profile
- Profile referenced by `--profile` must exist in `profiles` section

## Error Handling

- `profiles.yaml` not found → error with example format
- `defaults` or `profiles` missing → specific validation error
- Unknown profile name → list available profile names
- `${VAR}` unresolved → error showing var name and resolution chain
- Soul file not found → error with expected file path
- Podman not installed → error with install instructions
- Agent name collision → error showing existing container name

## Dependencies

- `commander` — CLI framework
- `js-yaml` — parse `profiles.yaml`
- `dotenv` — parse `./.env` for variable interpolation fallback
- `chalk` — colored terminal output
- [OpenSpec](https://github.com/anomalyco/opencode) — spec-driven change management workflow

## OpenSpec Workflow

This project uses [OpenSpec](https://github.com/anomalyco/opencode) for structured, spec-driven development. Features are planned as changes that go through a cycle of **propose → explore → design → tasks → implement → archive**. Completed changes are stored in `openspec/changes/archive/` with date-prefixed directories.

## Development Commands

- `node src/cli.js setup <name> --profile <profile>` — run setup
- `node src/cli.js chat <name>` — start chat
- `node src/cli.js list` — list agents
- `node src/cli.js delete <name>` — delete agent

## Code Style

- No comments unless explicitly requested
- No unnecessary logging
- All podman commands via `child_process` (execSync for sync ops, spawn for interactive)
- Use `chalk` for colored terminal output
