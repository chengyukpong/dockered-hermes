const chalk = require('chalk');
const { listContainers } = require('../lib/container');

function list() {
  try {
    const containers = listContainers();

    if (containers.length === 0) {
      console.log(chalk.gray('No agents found'));
      return;
    }

    const nameHeader = 'NAME';
    const statusHeader = 'STATUS';
    const maxNameLen = Math.max(
      nameHeader.length,
      ...containers.map((c) => c.name.length)
    );

    console.log(
      chalk.bold(
        nameHeader.padEnd(maxNameLen + 2) + statusHeader
      )
    );

    for (const c of containers) {
      const nameCol = c.name.padEnd(maxNameLen + 2);
      const isRunning = c.state === 'running';
      const statusCol = isRunning
        ? chalk.green(c.status)
        : chalk.gray(c.status);
      console.log(nameCol + statusCol);
    }
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

module.exports = list;
