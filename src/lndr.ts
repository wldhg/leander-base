#!/usr/bin/env -S node --experimental-modules

import fs from 'fs';
import yml from 'js-yaml';
import * as core from './core/load';

core.init.then(() => {
  core.log.info(`${core.config.name.full} ${core.config.version} initialized.`);

  switch (core.arg.fn.keyword) {
    default:
    case 'bot': {
      // Leander bot
      import('./bot/load.js').then((bot) => {
        const lndr = yml.safeLoad(
          fs.readFileSync(core.config.dir.data(['config.yml']), 'utf8'),
        );
        bot.wakeUp(core, lndr);
        core.onExit(bot.goodNight);
      });
      break;
    }
  }
}).catch(core.err.parse('Unexpected error occured.'));
