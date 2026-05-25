## 1. Project Scaffolding

- [x] 1.1 Create `package.json` with `commander`, `js-yaml`, `dotenv`, `chalk` dependencies and `bin` entry pointing to `src/cli.js`
- [x] 1.2 Create `src/cli.js` with Commander program registration, `setup` command definition accepting `<name>` argument and `--profile <name>` option
- [x] 1.3 Create directory structure: `src/commands/`, `src/lib/`

## 2. Config Module (`src/lib/config.js`)

- [x] 2.1 Implement `getContainerName(name)` returning `hermes-<name>`
- [x] 2.2 Implement `getVolumeName(name)` returning `hermes-data-<name>`
- [x] 2.3 Implement `getImage()` returning `docker.io/nousresearch/hermes-agent:latest`
- [x] 2.4 Implement `validateName(name)` checking alphanumeric + hyphens only
- [x] 2.5 Implement `listAgents()` listing containers with `hermes-` prefix via podman
- [x] 2.6 Add name collision check to `validateName` using `listAgents()`

## 3. Profiles Module (`src/lib/profiles.js`)

- [x] 3.1 Implement `loadProfiles(cwd)` parsing `profiles.yaml` with `js-yaml`
- [x] 3.2 Add validation: file existence, `defaults` section present, `profiles` section present and non-empty
- [x] 3.3 Implement `deepMerge(target, source)` utility for object merging
- [x] 3.4 Implement `resolveProfile(profiles, profileName)` merging defaults + profile (deep merge for env/config, replace for soul)
- [x] 3.5 Implement `interpolateEnv(env, cwd)` resolving `${VAR}` patterns with host env → `./.env` fallback
- [x] 3.6 Implement `resolveSoulPath(soulPath, cwd)` resolving relative paths and validating file existence

## 4. Container Module (`src/lib/container.js`)

- [x] 4.1 Implement `checkPodman()` verifying podman binary via `which podman` or `podman --version`
- [x] 4.2 Implement `pullImage()` running `podman pull docker.io/nousresearch/hermes-agent:latest`
- [x] 4.3 Implement `createVolume(volumeName)` running `podman volume create <volumeName>`
- [x] 4.4 Implement `removeVolume(volumeName)` running `podman volume rm <volumeName>`
- [x] 4.5 Implement `createContainer(name, volumeName, config)` with `--cpu`, `--memory`, `--disk-size`, `-p`, `-v hermes-data-<name>:/opt/data`, `sleep infinity`
- [x] 4.6 Implement `startContainer(name)` running `podman start hermes-<name>`
- [x] 4.7 Implement `stopContainer(name)` running `podman stop hermes-<name>`
- [x] 4.8 Implement `removeContainer(name)` running `podman rm -f hermes-<name>`
- [x] 4.9 Implement `copyIntoContainer(name, localPath, containerPath)` running `podman cp`
- [x] 4.10 Implement `inspectContainer(name)` running `podman inspect`, returning parsed JSON or null
- [x] 4.11 Implement `isRunning(name)` using inspect to check container state
- [x] 4.12 Implement `execInteractive(name, cmd)` spawning `podman exec -it` with `stdio: 'inherit'`

## 5. Setup Command (`src/commands/setup.js`)

- [x] 5.1 Implement the setup action handler: validate name → resolve profile → check podman → pull image → create volume → create container → start container → write `.env` and `SOUL.md` to temp dir → `podman cp` both into container → cleanup temp dir → stop container
- [x] 5.2 Add error handling wrapping each step with user-friendly messages using chalk
- [x] 5.3 Add success output: print agent name, profile used, and container status

## 6. Integration

- [x] 6.1 Wire `setup` command into `src/cli.js` with the action handler from `src/commands/setup.js`
- [x] 6.2 Verify end-to-end: `node src/cli.js setup test-agent --profile designer` runs without syntax errors
