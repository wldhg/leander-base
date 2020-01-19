/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import yml from 'js-yaml';
import * as fs from 'fs';
import * as core from './core/load';

core.init.then(() => {
  core.log.info(`${core.config.name.full} ${core.config.version} initialized.`);

  switch (core.arg.fn.keyword) {
    default:
    case 'bot': {
      // Leander bot
      import('./bot/load').then((bot) => {
        const lndrConf = yml.safeLoad(
          fs.readFileSync(core.config.dir.data(['config.yml']), 'utf8'),
        );
        bot.wakeUp(core, lndrConf);
      });
      break;
    }
  }
}).catch(core.err.parse('Unexpected error occured.'));
