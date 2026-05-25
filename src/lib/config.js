const { execSync } = require('child_process');

function getContainerName(name) {
  return `hermes-${name}`;
}

function getVolumeName(name) {
  return `hermes-data-${name}`;
}

function getImage() {
  return 'docker.io/nousresearch/hermes-agent:latest';
}

function validateName(name) {
  if (!/^[a-z0-9-]+$/i.test(name)) {
    throw new Error('Agent name must be alphanumeric with hyphens only');
  }
  const agents = listAgents();
  const containerName = getContainerName(name);
  if (agents.includes(containerName)) {
    throw new Error(`Agent '${name}' already exists (container ${containerName} found)`);
  }
}

function listAgents() {
  try {
    const output = execSync(
      'podman ps -a --filter name=hermes- --format {{.Names}}',
      { encoding: 'utf-8' }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = { getContainerName, getVolumeName, getImage, validateName, listAgents };
