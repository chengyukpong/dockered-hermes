# ARCHITECTURE — dockered-hermes

## Project Structure

```
dockered-hermes/
  package.json                # commander, js-yaml, dotenv, chalk; bin: "dockered-hermes"
  src/
    cli.js                    # Commander entry point, registers all commands
    commands/
      setup.js                # Create + init a new agent from profile
      chat.js                 # Interactive TUI attach via podman exec
      list.js                 # List agents + container status table
      delete.js               # Remove agent container + data
    lib/
      config.js               # Container/volume naming, name validation, agent discovery
      profiles.js             # YAML parsing, merge logic, env interpolation
      container.js            # Podman CLI wrappers (pull, create, start, exec, etc.)
```

## Data Layout

```
  hermes-data-<name>                  # Podman named volume (per agent)
    ├── .env                          # Merged env vars (injected via podman cp)
    ├── SOUL.md                       # Agent personality (injected via podman cp)
    ├── config.yaml                   # Bootstrapped by hermes entrypoint
    └── ...                           # Other hermes data (sessions, memories, etc.)

  ./profiles.yaml                     # Profile definitions (cwd, mandatory)
  ./.env                              # Fallback env vars for ${VAR} interpolation
  ./souls/                            # Soul files referenced by profiles
    default.md
    designer.md
    coder.md
```

No host-side persistent directories are created. All agent data lives inside Podman named volumes.

## Container Naming

- Container name: `hermes-<agent-name>`
- Volume name: `hermes-data-<agent-name>`
- Image: `docker.io/nousresearch/hermes-agent:latest`
- Runtime: Podman only (no Docker support)
- Container command: `sleep infinity` (agent stays ready for exec)

## profiles.yaml Schema

```yaml
defaults:                              # MANDATORY - base settings for all profiles
  model: deepseek-v4-flash             # Hermes model (sets config.yaml model.default)
  provider: deepseek                   # Hermes provider (sets config.yaml provider)
  config:                              # Container resource config
    cpu: "1"                           # Podman CPU limit (--cpus)
    memory: "1g"                       # Podman memory limit (--memory)
    disk: "5g"                         # Podman disk limit (--storage-opt size=, XFS only)
    gateway_port: 8642                 # Host port for gateway
    dashboard_port: 9119               # Host port for dashboard
  env:                                 # Environment variables
    DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}   # Interpolated at setup time
  soul: ./souls/default.md             # Path to SOUL.md (relative to cwd)

profiles:                              # MANDATORY - at least one profile
  designer:
    config:
      gateway_port: 8642               # Overrides default
      dashboard_port: 9119
    soul: ./souls/designer.md          # Replaces default soul
    env:                               # Merged with defaults.env
      FEISHU_APP_ID: cli_aa8c0aa4ef0a9e15
      FEISHU_APP_SECRET: ${NUNU_FEISHU_APP_SECRET}

  coder:
    config:
      gateway_port: 8643
      dashboard_port: 9120
    soul: ./souls/coder.md
    env:
      FEISHU_APP_ID: cli_aa8c610108e11e17
      FEISHU_APP_SECRET: ${TINA_FEISHU_APP_SECRET}
```

## Merge Rules

When resolving a profile, defaults and profile are merged as follows:

| Field       | Behavior                                                  |
|-------------|-----------------------------------------------------------|
| `env`       | Deep merge; profile values override defaults on conflict  |
| `config`    | Deep merge; profile values override defaults on conflict  |
| `soul`      | Profile replaces default entirely (no merge)              |
| `model`     | Profile overrides default                                 |
| `provider`  | Profile overrides default                                 |
| `base_url`  | Profile overrides default                                 |

## Environment Variable Interpolation

Values containing `${VAR_NAME}` are interpolated at setup time.

Resolution order:
1. Host environment (`process.env`)
2. `./.env` file in current working directory (parsed with dotenv)
3. Throw error with var name and full resolution chain attempted

## Module Responsibilities

### `src/lib/config.js`

Provides naming and validation helpers.

Functions:
- `getContainerName(name)` → `hermes-<name>`
- `getVolumeName(name)` → `hermes-data-<name>`
- `getImage()` → `docker.io/nousresearch/hermes-agent:latest`
- `validateName(name)` → alphanumeric + hyphens, no collision with existing containers
- `listAgents()` → list containers with `hermes-` prefix via podman

### `src/lib/profiles.js`

Handles profile loading, merging, and interpolation.

Functions:
- `loadProfiles(cwd)` → parse and validate `profiles.yaml`
- `resolveProfile(profiles, profileName)` → merge defaults + named profile (env, config, soul, model, provider, base_url)
- `interpolateEnv(env, cwd)` → resolve `${VAR}` in all env values
- `resolveSoulPath(soulPath, cwd)` → resolve relative path, validate file exists

Validation:
- `profiles.yaml` must exist in cwd
- `defaults` section must be present
- `profiles` section must be present with at least one entry
- Referenced profile name must exist in `profiles`

### `src/lib/container.js`

Wraps all Podman CLI interactions.

Functions:
- `checkPodman()` → verify `podman` binary exists and is executable
- `pullImage()` → `podman pull docker.io/nousresearch/hermes-agent:latest`
- `createVolume(volumeName)` → `podman volume create <name>` (idempotent, ignores "already exists")
- `removeVolume(volumeName)` → `podman volume rm <name>`
- `createContainer(name, volumeName, config, envFilePath)` → `podman create` with:
  - `--name hermes-<name>`
  - `--cpus <config.cpu>`
  - `--memory <config.memory>`
  - `--storage-opt size=<config.disk>` (XFS only, warning + skip on other filesystems)
  - `--env-file <path>` (passes env vars as container environment)
  - `-p <config.gateway_port>:<port>`
  - `-p <config.dashboard_port>:<port>`
  - `-v hermes-data-<name>:/opt/data`
  - Image + `sleep infinity`
- `startContainer(name)` → `podman start hermes-<name>`
- `stopContainer(name)` → `podman stop hermes-<name>`
- `removeContainer(name)` → `podman rm -f hermes-<name>`
- `copyIntoContainer(name, localPath, containerPath)` → `podman cp`
- `execInContainer(name, cmd)` → `podman exec hermes-<name> bash -c "<cmd>"` (sync)
- `execInteractive(name, cmd)` → `podman exec -it hermes-<name> <cmd>` (spawn, inherits stdio, returns ChildProcess)
- `inspectContainer(name)` → `podman inspect hermes-<name>`, parse JSON
- `isRunning(name)` → check container state, return boolean
- `listContainers()` → `podman ps -a --filter name=hermes- --format json`
- `containerExists(name)` → uses `inspectContainer` to check existence

## Container Lifecycle

```
setup <name>
  → podman pull
  → podman volume create hermes-data-<name>  (idempotent)
  → podman create (--env-file, --cpus, --memory, --storage-opt if XFS, -p, -v, sleep infinity)
  → podman start  (entrypoint bootstraps config.yaml, SOUL.md, etc.)
  → podman cp .env + SOUL.md → /opt/data/
  → patch /opt/data/config.yaml (model.default, provider, comment out base_url)
  → podman stop   (agent is ready, not running)

chat <name>
  → podman start  (if stopped)
  → podman exec -it hermes-<name> /opt/hermes/.venv/bin/hermes  (interactive TUI)
  → container stays running after exec exits

list
  → podman ps -a --filter name=hermes-
  → print table: NAME | STATUS (chalk: green=running, gray=other)

delete <name>
  → prompt confirmation (y/N)
  → podman rm -f  (stop + remove)
  → podman volume rm hermes-data-<name>
```

## Port Mapping

Each agent exposes two ports mapped from container to host:

| Port Type      | Profile Config Key  | Purpose                          |
|----------------|---------------------|----------------------------------|
| Gateway Port   | `config.gateway_port`   | Hermes messaging gateway      |
| Dashboard Port | `config.dashboard_port` | Web dashboard                 |

The profile config defines the **host-side** port. The container-side port is determined by the hermes-agent image defaults.

## Error Handling Strategy

All errors are caught and presented as user-friendly messages. No stack traces in normal operation.

| Condition                    | Error Message                                      |
|------------------------------|----------------------------------------------------|
| `profiles.yaml` not found    | "profiles.yaml not found in <cwd>" + example format |
| `defaults` missing           | "profiles.yaml must contain a 'defaults' section" |
| `profiles` missing           | "profiles.yaml must contain a 'profiles' section" |
| Unknown profile name         | "Profile '<name>' not found. Available: ..."       |
| `${VAR}` unresolved          | "Cannot resolve ${VAR}: not in host env or ./.env" |
| Soul file not found          | "Soul file not found: <resolved-path>"             |
| Podman not installed         | "podman not found. Install: https://podman.io/getting-started/installation" |
| Agent name collision         | "Agent '<name>' already exists (container hermes-<name> found)" |
| Invalid agent name           | "Agent name must be alphanumeric with hyphens only" |
