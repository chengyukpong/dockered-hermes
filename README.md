# dockered-hermes

A CLI tool for managing multiple isolated [Hermes Agent](https://github.com/NousResearch/hermes) instances using Podman containers. Each agent runs in its own sandboxed container with its own data volume, configuration, and personality.

## Prerequisites

- [Podman](https://podman.io/getting-started/installation) installed and accessible in `$PATH`
- Node.js >= 14

## Install

```bash
npm install
npm link
```

This makes the `dockered-hermes` command available globally.

## Quick Start

### 1. Create your `profiles.yaml`

Place a `profiles.yaml` in your working directory:

```yaml
defaults:
  config:
    cpu: "1"
    memory: "1g"
    disk: "5g"
    gateway_port: 8642
    dashboard_port: 9119
  env:
    HERMES_INFERENCE_PROVIDER: deepseek
    DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
  soul: ./souls/default.md

profiles:
  designer:
    config:
      gateway_port: 8642
      dashboard_port: 9119
    soul: ./souls/designer.md
    env:
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

### 2. Create a `.env` file (optional)

For secrets that shouldn't be in `profiles.yaml`:

```
DEEPSEEK_API_KEY=sk-xxx
NUNU_FEISHU_APP_SECRET=xxx
TINA_FEISHU_APP_SECRET=xxx
```

### 3. Create soul files

```
./souls/
  default.md
  designer.md
  coder.md
```

### 4. Set up an agent

```bash
dockered-hermes setup my-designer --profile designer
```

This will:
- Pull the hermes-agent container image
- Create a Podman named volume for the agent's data
- Create and start the container
- Inject the `.env` and `SOUL.md` into the container
- Stop the container (ready for chat)

### 5. Chat with your agent

```bash
dockered-hermes chat my-designer
```

The container starts and opens an interactive TUI session. The container keeps running after you exit.

### 6. List all agents

```bash
dockered-hermes list
```

### 7. Delete an agent

```bash
dockered-hermes delete my-designer
```

Prompts for confirmation, then removes the container and its data volume.

## Commands

| Command | Description |
|---------|-------------|
| `setup <name> --profile <name>` | Create a new agent from a profile |
| `chat <name>` | Start an interactive chat session |
| `list` | List all agents and their status |
| `delete <name>` | Remove an agent and its data |

## How Profiles Work

Profiles are defined in `profiles.yaml` with a `defaults` section and one or more named profiles under `profiles`.

**Merge rules:**

| Field | Behavior |
|-------|----------|
| `env` | Deep merge — profile values override defaults |
| `config` | Deep merge — profile values override defaults |
| `soul` | Profile replaces default entirely |

**Environment variable interpolation:**

Values containing `${VAR_NAME}` are resolved at setup time in this order:

1. Host environment (`process.env`)
2. `./.env` file in the working directory
3. Error if unresolved

## How Agent Data Is Stored

Each agent gets:

- A Podman container named `hermes-<agent-name>`
- A Podman named volume `hermes-data-<agent-name>` mounted at `/opt/data` inside the container

No host-side directories are created. All agent data (sessions, memories, config) lives inside the Podman volume. Use standard Podman commands to inspect or back up volumes if needed.

## Error Messages

| Condition | Message |
|-----------|---------|
| `profiles.yaml` missing | `profiles.yaml not found in <cwd>` |
| Missing `defaults` section | `profiles.yaml must contain a 'defaults' section` |
| Missing `profiles` section | `profiles.yaml must contain a 'profiles' section` |
| Unknown profile | `Profile '<name>' not found. Available: ...` |
| Unresolved `${VAR}` | `Cannot resolve ${VAR}: not in host env or ./.env` |
| Soul file not found | `Soul file not found: <path>` |
| Podman not installed | `podman not found. Install: https://podman.io/getting-started/installation` |
| Agent name collision | `Agent '<name>' already exists (container hermes-<name> found)` |
| Invalid agent name | `Agent name must be alphanumeric with hyphens only` |
