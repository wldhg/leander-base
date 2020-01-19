/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

// Program argument parsing & help module

import 'colors';

let err;

export const setErrorModule = (parserr): void => {
  err = parserr;
};

export const printHelp = (config, arg): Promise<unknown> => {
  const helpConstructor = new Promise((resolve, reject) => {
    const help = [];
    if (arg.help === true && !arg.fn.isDefault) {
      help.push(`${arg.fn.keyword.bold.underline}: ${arg.fn.description}`);

      // Generate "Usage" string
      const usageList = [];
      let nameList = [arg.fn.keyword];
      if (arg.fn.abbr) {
        nameList.push(arg.fn.abbr);
      }
      if (arg.fn.alias) {
        nameList = nameList.concat(arg.fn.alias);
      }
      nameList.forEach((callName) => {
        usageList.push(
          `사용법: ${config.name.abbr.bold} ${callName} [OPTION]...`,
        );
      });
      help.push(usageList.join('\n'));


      const optionList = ['옵션:'];
      if (arg.fn.options && arg.fn.options.length > 0) {
        const flagList = [];
        const descList = [];
        let longestFlagLength = 0;

        arg.fn.options.forEach((opt) => {
          if (typeof config.arg.opt[opt] === 'object') {
            const flagString = config.arg.opt[opt].flags.join(', ');

            if (flagString.length > longestFlagLength) {
              longestFlagLength = flagString.length;
            }

            flagList.push(flagString);
            descList.push(config.arg.opt[opt].description);
          } else {
            reject(
              err.make(`옵션 객체가 없습니다: ${opt}`),
            );
          }
        });

        longestFlagLength += 6;

        for (let i = 0; i < flagList.length; i += 1) {
          let optString = `  ${flagList[i]}`;
          const space = longestFlagLength - flagList[i].length;

          for (let j = 0; j < space; j += 1) {
            optString += ' ';
          }

          optionList.push(optString + descList[i]);
        }
      } else {
        optionList.push('  이 기능에는 옵션이 없습니다.');
      }
      help.push(optionList.join('\n'));

      help.push(
        `기능 목록을 보려면 ${(`${config.name.abbr} help`).bold} 를 입력하세요.`,
      );
    } else if (arg.fn.keyword === 'help' || (arg.fn.isDefault && arg.help)) {
      help.push(`${config.name.full.bold.underline}: ${config.description}`);
      help.push(`사용법: ${config.name.abbr.bold} [기능 이름] [옵션]...`);

      const funcList = ['기능:'];
      const keywordList = [];
      const descList = [];
      let longestKWLength = 0;

      Object.values(config.arg.fn).forEach((v: AppFnItem) => {
        let keywordString = '';

        if (typeof v.abbr === 'string') {
          keywordString = `${v.keyword}, ${v.abbr}`;
        } else {
          keywordString = v.keyword;
        }
        if (keywordString.length > longestKWLength) {
          longestKWLength = keywordString.length;
        }

        keywordList.push(keywordString);
        descList.push(v.description);
      });

      longestKWLength += 6;

      for (let i = 0; i < keywordList.length; i += 1) {
        let funcString = `  ${keywordList[i]}`;
        const space = longestKWLength - keywordList[i].length;

        for (let j = 0; j < space; j += 1) funcString += ' ';

        funcList.push(funcString + descList[i]);
      }

      help.push(funcList.join('\n'));
      help.push(
        `${
          (`${config.name.abbr} 기능 이름 --help`).bold
        } 을 입력하여 해당 기능에 대한 더 자세한 정보, 옵션을 볼 수 있습니다.`,
      );
    } else {
      reject(
        err.make('도움말을 표시할 조건이 아닙니다.'),
      );
    }

    resolve(process.stdout.write(`\n${help.join('\n\n')}\n\n`));
  });
  return helpConstructor;
};

export const parse = (config, command): Promise<unknown> => {
  const analyzed: AppArgAnalyzed = {};

  return new Promise((resolve, reject) => {
    // Gather all available keywords
    const availableKeywords = {
      help: {
        keyword: 'help',
        description: '도움말을 출력합니다.',
      },
    };
    const functions = Object.keys(config.fn);
    for (let i = 0; i < functions.length; i += 1) {
      const fn = config.fn[functions[i]];
      availableKeywords[fn.keyword] = fn;
      if (fn.abbr && fn.abbr.length > 0) {
        availableKeywords[fn.abbr] = fn;
      }
      if (fn.alias && fn.alias.length > 0) {
        fn.alias.forEach((alias) => {
          availableKeywords[alias] = fn;
        });
      }
    }

    // Get the keyword of main function
    let mainKeyword;
    let isDefault = false;
    if (process.argv.length < 2) {
      reject(
        err.make(
          '프로그램에 입력된 인자 수가 부족합니다. 지원되지 않는 실행 환경일 수 있습니다.',
          { arguments: process.argv },
        ),
      );
    } else if (process.argv.length === 2 || process.argv[2].charAt(0) === '-') {
      mainKeyword = config.fn.default.keyword;
      isDefault = true;
    } else {
      // eslint-disable-next-line prefer-destructuring
      mainKeyword = process.argv[2];
    }

    // Get main function or throw error
    let mainFn;
    if (Object.keys(availableKeywords).includes(mainKeyword)) {
      mainFn = availableKeywords[mainKeyword];
      analyzed.fn = mainFn;
      analyzed.fn.isDefault = isDefault;
    } else {
      reject(
        err.make(
          `${mainKeyword}: 없는 기능입니다. 기능 목록을 보려면 ${
            (`${command} help`).white.bold().underline
          } 를 입력하세요.`,
        ),
      );
    }

    // Gather all available options of main function
    const helpOption = {
      flags: ['-h', '--help'],
      type: 'flag',
      description: '도움말을 출력합니다.',
      required: false,
      name: 'help',
    };
    const availableOptionKeywords = {
      '-h': helpOption,
      '--help': helpOption,
    };
    const requiredOptionsNames = [];
    const requiredOptions = [];
    if (mainFn.options) {
      for (let i = 0; i < mainFn.options.length; i += 1) {
        const opt = config.opt[mainFn.options[i]];
        opt.name = mainFn.options[i];
        if (opt.required) {
          requiredOptionsNames.push(mainFn.options[i]);
          requiredOptions.push(opt);
        }
        opt.flags.forEach((flag) => {
          availableOptionKeywords[flag] = opt;
        });
      }
    }

    // Create type checking function
    const trueStrings = ['y', 'yes', 'on', 'true', 't', '1'];
    const falseStrings = ['n', 'no', 'off', 'false', 'f', '0'];
    const refineValue = (arg, type): number | void | string | boolean => {
      let result;
      switch (type) {
        default: {
          reject(
            err.make(`알 수 없는 옵션 종류입니다: ${type}`),
          );
          break;
        }
        case 'bool':
        case 'boolean': {
          if (trueStrings.includes(arg)) {
            result = true;
          } else if (falseStrings.includes(arg)) {
            result = false;
          } else {
            reject(
              err.make(`'true' 혹은 'false'가 예상되었지만 다른 값이었습니다: ${arg}`),
            );
          }
          break;
        }
        case 'num':
        case 'number': {
          result = Number(arg);
          if (Number.isNaN(result)) {
            reject(
              err.make(`숫자가 예상되었지만 다른 값이었습니다: ${arg}`),
            );
          }
          break;
        }
        case 'str':
        case 'string': {
          result = arg;
          break;
        }
      }
      return result;
    };

    // Parse all optional arguments
    let dataRequired = 0;
    let dataRequiredOriginal = 0;
    let dataType;
    let dataName;
    let dataPool;
    let isMultipleInput = false;
    process.argv.slice(analyzed.fn.isDefault ? 2 : 3).forEach((arg) => {
      if (dataRequired > 0) {
        const parsedValue = refineValue(arg, dataType);
        if (isMultipleInput) {
          dataPool[dataName].push(parsedValue);
        } else {
          dataPool[dataName] = parsedValue;
        }
        dataRequired -= 1;
      } else if (arg.charAt(0) === '-') {
        const selectedOption = availableOptionKeywords[arg];
        if (selectedOption) {
          if (selectedOption.required) {
            const reqOptIndex = requiredOptionsNames.indexOf(selectedOption.name);
            if (reqOptIndex > -1) {
              requiredOptionsNames.splice(reqOptIndex, 1);
              requiredOptions.splice(reqOptIndex, 1);
            }
          }
          if (selectedOption.type === 'flag') {
            analyzed[selectedOption.name] = true;
          } else {
            if (selectedOption.multiple) {
              if (!analyzed[selectedOption.name]) analyzed[selectedOption.name] = [];
              dataPool = analyzed[selectedOption.name];
              dataName = dataPool.length;
              dataType = selectedOption.type;
            } else {
              dataPool = analyzed;
              dataName = selectedOption.name;
              dataType = selectedOption.type;
            }
            if (selectedOption.inputCount && selectedOption.inputCount > 1) {
              isMultipleInput = true;
              dataRequired = selectedOption.inputCount;
              dataRequiredOriginal = selectedOption.inputCount;
              dataPool[dataName] = [];
            } else {
              isMultipleInput = false;
              dataRequired = 1;
              dataRequiredOriginal = 1;
            }
          }
        } else {
          reject(
            err.make(`알 수 없는 옵션입니다: ${arg}`),
          );
        }
      } else {
        reject(
          err.make(`알 수 없는 값입니다: ${arg}. 옵션은 '-' 또는 '--' 문자와 함께 시작합니다.`),
        );
      }
    });

    // Check whether if is not finished
    if (analyzed.help !== true) {
      if (dataRequired > 0) {
        reject(
          err.make(`입력 인자 수가 부족합니다. ${dataName} 옵션은 ${dataRequiredOriginal} 개의 값이 필요하지만 받은 값의 수는 ${dataRequiredOriginal - dataRequired} 개 였습니다.`),
        );
      } else if (requiredOptionsNames.length > 0) {
        const requiredFlags = [];
        requiredOptions.forEach((opt) => {
          requiredFlags.push(opt.flags);
        });
        reject(
          err.make('다음 옵션은 반드시 입력되어야 합니다.', requiredFlags),
        );
      }
    }

    return resolve(analyzed);
  });
};
