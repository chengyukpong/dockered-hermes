## 1. Container Module Extension (`src/lib/container.js`)

- [x] 1.1 Implement `listContainers()` running `podman ps -a --filter name=hermes- --format json`, returning parsed container list with name and status fields

## 2. List Command (`src/commands/list.js`)

- [x] 2.1 Implement the list action handler: call `listContainers()` → format table → print
- [x] 2.2 Implement table formatting with aligned columns (NAME, STATUS) and chalk coloring (green for running, gray for others)
- [x] 2.3 Handle empty state: print "No agents found" when no containers match

## 3. Integration

- [x] 3.1 Wire `list` command into `src/cli.js` with no arguments
- [x] 3.2 Verify: `node src/cli.js list` prints agent table or "No agents found"
