const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const { getImage } = require('./config');

function checkPodman() {
  try {
    execSync('podman --version', { encoding: 'utf-8', stdio: 'pipe' });
  } catch {
    throw new Error(
      'podman not found. Install: https://podman.io/getting-started/installation'
    );
  }
}

function pullImage() {
  try {
    return execSync(`podman pull ${getImage()}`, { encoding: 'utf-8', stdio: 'inherit' });
  } catch (err) {
    throw new Error(`Failed to pull image: ${err.stderr || err.message}`);
  }
}

function createVolume(volumeName) {
  try {
    execSync(`podman volume create ${volumeName}`, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (err) {
    if (!err.stderr?.includes('already exists')) throw err;
  }
}

function removeVolume(volumeName) {
  try {
    execSync(`podman volume rm ${volumeName}`, { encoding: 'utf-8' });
  } catch (err) {
    console.warn(`Warning: failed to remove volume ${volumeName}: ${err.message}`);
  }
}

function supportsStorageOpt() {
  try {
    const output = execSync('podman info --format {{.Store.GraphDriverName}}', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (output !== 'overlay') return false;
    const backingFs = execSync('podman info --format {{.Store.BackingFilesystem}}', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim().toLowerCase();
    return backingFs.includes('xfs');
  } catch {
    return false;
  }
}

function createContainer(name, volumeName, config, envFilePath) {
  const image = getImage();
  const args = [
    'create',
    '--name', `hermes-${name}`,
    '--cpus', String(config.cpu),
    '--memory', config.memory,
  ];

  if (envFilePath) {
    args.push('--env-file', envFilePath);
  }

  if (config.disk) {
    if (supportsStorageOpt()) {
      args.push('--storage-opt', `size=${config.disk}`);
    } else {
      console.warn(
        chalk.yellow(`Warning: disk size limit (${config.disk}) skipped — requires XFS backing filesystem`)
      );
    }
  }

  args.push(
    '-p', `${config.gateway_port}:8642`,
    '-p', `${config.dashboard_port}:9119`,
    '-v', `${volumeName}:/opt/data`,
    image,
    'sleep', 'infinity',
  );
  try {
    return execSync(`podman ${args.join(' ')}`, { encoding: 'utf-8' });
  } catch (err) {
    throw new Error(`Failed to create container: ${err.stderr || err.message}`);
  }
}

function startContainer(name) {
  execSync(`podman start hermes-${name}`, { encoding: 'utf-8' });
}

function execInContainer(name, cmd) {
  execSync(`podman exec hermes-${name} bash -c ${JSON.stringify(cmd)}`, {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
}

function stopContainer(name) {
  execSync(`podman stop hermes-${name}`, { encoding: 'utf-8' });
}

function removeContainer(name) {
  execSync(`podman rm -f hermes-${name}`, { encoding: 'utf-8' });
}

function copyIntoContainer(name, localPath, containerPath) {
  execSync(`podman cp ${localPath} hermes-${name}:${containerPath}`, {
    encoding: 'utf-8',
  });
}

function inspectContainer(name) {
  try {
    const output = execSync(`podman inspect hermes-${name}`, { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function isRunning(name) {
  const info = inspectContainer(name);
  if (!info || !info[0]) return false;
  return info[0].State?.Status === 'running';
}

function listContainers() {
  try {
    const output = execSync(
      'podman ps -a --filter name=hermes- --format json',
      { encoding: 'utf-8' }
    );
    const containers = JSON.parse(output);
    return containers.map((c) => ({
      name: c.Names,
      status: c.Status,
      state: c.State,
    }));
  } catch {
    return [];
  }
}

function containerExists(name) {
  return inspectContainer(name) !== null;
}

function execInteractive(name, cmd) {
  return spawn('podman', ['exec', '-it', `hermes-${name}`, ...cmd.split(' ')], {
    stdio: 'inherit',
  });
}

module.exports = {
  checkPodman,
  pullImage,
  createVolume,
  removeVolume,
  createContainer,
  startContainer,
  execInContainer,
  stopContainer,
  removeContainer,
  copyIntoContainer,
  inspectContainer,
  isRunning,
  listContainers,
  containerExists,
  execInteractive,
};
