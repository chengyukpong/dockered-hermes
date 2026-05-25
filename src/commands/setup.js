const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const { validateName, getContainerName, getVolumeName } = require('../lib/config');
const { loadProfiles, resolveProfile, interpolateEnv, resolveSoulPath } = require('../lib/profiles');
const { checkPodman, pullImage, createVolume, createContainer, startContainer, stopContainer, copyIntoContainer, execInContainer } = require('../lib/container');

function setup(name, profileName) {
  try {
    validateName(name);

    const cwd = process.cwd();
    const profiles = loadProfiles(cwd);
    const resolved = resolveProfile(profiles, profileName);
    const env = interpolateEnv(resolved.env, cwd);
    const soulPath = resolveSoulPath(resolved.soul, cwd);

    checkPodman();

    const containerName = getContainerName(name);
    const volumeName = getVolumeName(name);

    console.log(chalk.blue('Pulling image...'));
    pullImage();

    console.log(chalk.blue('Creating volume...'));
    createVolume(volumeName);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-setup-'));
    let envFile;

    try {
      const envContent = Object.entries(env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
      envFile = path.join(tmpDir, '.env');
      fs.writeFileSync(envFile, envContent);

      const soulFile = path.join(tmpDir, 'SOUL.md');
      fs.copyFileSync(soulPath, soulFile);

      console.log(chalk.blue('Creating container...'));
      createContainer(name, volumeName, resolved.config, envFile);

      console.log(chalk.blue('Starting container...'));
      startContainer(name);

      console.log(chalk.blue('Injecting configuration files...'));
      copyIntoContainer(name, soulFile, '/opt/data/');
      copyIntoContainer(name, envFile, '/opt/data/.env');

      if (resolved.model) {
        console.log(chalk.blue('Configuring model...'));
        execInContainer(name, `sed -i 's|^  default:.*|  default: "${resolved.model}"|' /opt/data/config.yaml`);
        if (resolved.provider) {
          execInContainer(name, `sed -i 's|^  provider:.*|  provider: "${resolved.provider}"|' /opt/data/config.yaml`);
        }
        if (resolved.base_url) {
          execInContainer(name, `sed -i 's|^  base_url:.*|  base_url: "${resolved.base_url}"|' /opt/data/config.yaml`);
        } else if (resolved.provider && resolved.provider !== 'auto') {
          execInContainer(name, `sed -i 's|^  base_url:.*|  # base_url: auto-detected from provider|' /opt/data/config.yaml`);
        }
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    console.log(chalk.blue('Stopping container...'));
    stopContainer(name);

    console.log();
    console.log(chalk.green('Agent setup complete!'));
    console.log(`  Name:      ${chalk.bold(name)}`);
    console.log(`  Profile:   ${chalk.bold(profileName)}`);
    console.log(`  Container: ${chalk.bold(containerName)}`);
    console.log(`  Volume:    ${chalk.bold(volumeName)}`);
    console.log();
    console.log(chalk.gray(`Run 'dockered-hermes chat ${name}' to start chatting.`));
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

module.exports = setup;
