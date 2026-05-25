## 1. Container Module Extension (`src/lib/container.js`)

- [x] 1.1 Implement `listContainers()` running `podman ps -a --filter name=hermes- --format json`, returning parsed container list
- [x] 1.2 Implement `containerExists(name)` using `listContainers()` to check if `hermes-<name>` is present

## 2. Chat Command (`src/commands/chat.js`)

- [x] 2.1 Implement the chat action handler: validate agent exists → start container → spawn interactive exec → wait for exit
- [x] 2.2 Add error handling with user-friendly messages using chalk (agent not found, podman errors)

## 3. Integration

- [x] 3.1 Wire `chat` command into `src/cli.js` with `<name>` argument
- [x] 3.2 Verify: `node src/cli.js chat test-agent` starts container and attaches TUI
