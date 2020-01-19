/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */
// Core Loader

import path from 'path';
import Log from './logger';
import format from '../util/format';
import iterate from '../util/iterate';
import mkdir from '../util/mkdir';
import random from '../util/random';
import ordinalSuffix from '../util/ordinalSuffix';
import * as appinfo from './appinfo';
import * as arghelp from './arghelp';
import * as exitmgr from './exitmgr';
import * as parserr from './parserr';
import * as json from '../util/json';

export const coreVersion = '1.1.5';

const logInstance = new Log();
export function log(data, title) {
  return logInstance.plain(data, title);
}
log.info = logInstance.info;
log.error = logInstance.error;
log.debug = logInstance.debug;
log.warn = logInstance.warn;
log.okay = logInstance.okay;
log.i = 0;

const { code, onExit } = exitmgr;
export { code as exit, onExit };

export const arg: AppArgAnalyzed = {};
export const config: AppConfig = {};
export const err = { make: parserr.make, parse: parserr.parse };
export const util = {
  format,
  iterate,
  mkdir,
  random,
  json,
  ordinalSuffix,
};

/**
 * Initializes core.
 * You can connect promise chain without calling this as function.
 */
export const init = json.parse(path.resolve('package.json'))
  .then((pkg) => {
    Object.assign(config, pkg);
    Object.assign(config, appinfo);
    return mkdir(config.dir.DATA);
  })
  .then(
    () => logInstance.init(`${config.name.abbr}.log`, config.dir.DATA, 'log'),
  )
  .then(() => {
    log.i = logInstance.nowi;
    exitmgr.setLogger(logInstance);
    parserr.setLogger(logInstance);
    parserr.setExitManager(exitmgr);
    arghelp.setErrorModule(parserr);
    return arghelp.parse(config.arg, config.name.abbr);
  })
  .then(
    (parsedArgs) => {
      Object.assign(arg, parsedArgs);
      let context;
      if (arg.help === true || arg.fn.keyword === 'help') {
        context = arghelp.printHelp(config, arg)
          .then(
            () => exitmgr.code(0),
            parserr.parse('Failed to print help message.', 2),
          );
      }
      return context;
    }, (parseError) => {
      if (process.argv[2] === 'help') {
        log.warn(`To see help message of a specified function, enter \`${config.name.abbr} FUNCTION --help\`.`);
      }
      return parserr.parse('Failed to parse arguments.', 1)(parseError);
    },
  );
