#!/usr/bin/env node

const { program } = require('commander');

program
  .name('dockered-hermes')
  .description('Manage multiple isolated Hermes Agent instances using Podman containers');

program
  .command('setup <name>')
  .description('Create a new hermes agent sandbox from a profile')
  .requiredOption('--profile <name>', 'profile to use from profiles.yaml')
  .action((name, options) => {
    require('./commands/setup')(name, options.profile);
  });

program
  .command('list')
  .description('List all managed agents and their container status')
  .action(() => {
    require('./commands/list')();
  });

program
  .command('chat <name>')
  .description('Start an interactive chat session with a named agent')
  .action((name) => {
    require('./commands/chat')(name);
  });

program
  .command('delete <name>')
  .description('Remove an agent entirely')
  .action((name) => {
    require('./commands/delete')(name);
  });

program.parse();
