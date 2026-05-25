const readline = require('readline');
const chalk = require('chalk');
const { getVolumeName } = require('../lib/config');
const { containerExists, removeContainer, removeVolume } = require('../lib/container');

function promptConfirmation(name) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      chalk.yellow(`Delete agent '${name}' and all its data? (y/N) `),
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      }
    );
  });
}

async function deleteAgent(name) {
  try {
    if (!containerExists(name)) {
      throw new Error(`Agent '${name}' not found`);
    }

    const confirmed = await promptConfirmation(name);
    if (!confirmed) {
      console.log(chalk.gray('Cancelled'));
      return;
    }

    console.log(chalk.blue('Removing container...'));
    removeContainer(name);

    const volumeName = getVolumeName(name);
    console.log(chalk.blue('Removing volume...'));
    removeVolume(volumeName);

    console.log(chalk.green(`Agent '${name}' deleted`));
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

module.exports = deleteAgent;
