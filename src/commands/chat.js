const chalk = require('chalk');
const { containerExists, startContainer, execInteractive } = require('../lib/container');

function chat(name) {
  try {
    if (!containerExists(name)) {
      throw new Error(`Agent '${name}' not found`);
    }

    startContainer(name);

    console.log(chalk.blue(`Connecting to agent '${name}'...`));

    const child = execInteractive(name, '/opt/hermes/.venv/bin/hermes');

    child.on('exit', () => {
      console.log(chalk.gray(`Disconnected from agent '${name}'. Container is still running.`));
    });
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

module.exports = chat;
