## 1. Container Module Extension (`src/lib/container.js`)

- [x] 1.1 Implement `removeVolume(volumeName)` running `podman volume rm <volumeName>`
- [x] 1.2 Implement `listContainers()` running `podman ps -a --filter name=hermes- --format json` (if not already present)
- [x] 1.3 Implement `containerExists(name)` using `listContainers()` (if not already present)

## 2. Delete Command (`src/commands/delete.js`)

- [x] 2.1 Implement the delete action handler: validate agent exists → prompt confirmation → remove container → remove volume → print success
- [x] 2.2 Implement confirmation prompt using Node `readline`: "Delete agent '<name>' and all its data? (y/N)"
- [x] 2.3 Add error handling with user-friendly messages using chalk (agent not found, volume removal warning, podman errors)

## 3. Integration

- [x] 3.1 Wire `delete` command into `src/cli.js` with `<name>` argument
- [x] 3.2 Verify: `node src/cli.js delete test-agent` prompts and removes container + volume on confirmation
