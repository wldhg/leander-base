/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

// Logging module

import fs, { WriteStream } from 'fs';
import path from 'path';
import util from 'util';
import moment from 'moment';
import colors from 'colors';
import mkdir from '../util/mkdir';

/**
 * The logger includes fsout and stdout.
 */
class Logger {
  constructor(logFile = 'process.log', logDirBase: string | false = false, logDirAddi: string | false = false) {
    // Initialize log files
    if (logDirBase) {
      this.savePaths(logDirBase, logDirAddi, logFile);
      this.init();
    }
  }

  private fstream: WriteStream;

  private logDirBase: string;

  private logDirAddi: string;

  private logFile: string;

  private logDir: string;

  private logPath: string;

  previ: number;

  nowi: number;

  private savePaths = (logDirBase?: string | false, logDirAddi?: string | false,
    logFile?: string): void => {
    this.logDirBase = logDirBase || '';
    this.logDirAddi = logDirAddi || '';
    this.logFile = logFile;
    this.logDir = path.join(this.logDirBase, this.logDirAddi);
    this.logPath = path.join(this.logDir, this.logFile);
  }

  init = (logFile = 'process.log', logDirBase: string | false = false, logDirAddi: string | false = false): Promise<void | Error> => {
    // Finalize log directory and the name of log file
    if (logDirBase) {
      this.savePaths(logDirBase, logDirAddi, logFile);
    } else if (!this.logDir) {
      throw new Error('로그 저장 디렉토리가 지정되지 않았습니다. 로거를 초기화할 수 없습니다.');
    }

    // Create log stream
    const self = this;
    return new Promise((resolve, reject) => {
      // Stream opening function
      const openFStream = (renamedPath, i): void => {
        this.fstream = fs.createWriteStream(this.logPath);
        this.previ = i;
        this.nowi = i + 1;
        if (renamedPath !== null) {
          this.info(`이전 로그 파일을 ${renamedPath} 로 옮겼습니다.`);
        }
        resolve();
      };

      // Start to check existing file structure
      fs.access(this.logDir, fs.constants.F_OK, (dirAccErr) => {
        if (dirAccErr) {
          // No log directory -> make & try to write file
          try {
            mkdir(this.logDirBase, this.logDirAddi).then(() => openFStream(null, -1));
          } catch (mdErr) {
            self.error('로그 저장 디렉토리 생성에 실패했습니다.');
            reject(mdErr);
          }
        } else {
          // Log directory exists -> check if log file exists
          try {
            const stats = fs.statSync(this.logPath);
            if (stats.size < 2) {
              // Just open the file, because it's very small (not valuable)
              let findLastLog = false;
              let lastLogNumber = -1;
              do {
                try {
                  fs.accessSync(`${this.logPath}.${lastLogNumber + 1}`);
                  lastLogNumber += 1;
                } catch (logAccErr) {
                  if (logAccErr.code === 'ENOENT') {
                    findLastLog = true;
                  } else {
                    self.error('이전 로그 파일을 찾을 수 없었습니다.');
                    reject(logAccErr);
                  }
                }
              }
              while (!findLastLog);
              openFStream(null, lastLogNumber);
            } else {
              // Log file exists -> move log file
              const renameLog = (i): void => {
                // Set destination path
                const renamedPath = `${this.logPath}.${i}`;
                fs.access(renamedPath, fs.constants.F_OK, (renAccErr) => {
                  if (renAccErr) {
                    if (renAccErr.code === 'ENOENT') {
                      // File does not exists
                      fs.rename(this.logPath, renamedPath, (renErr) => {
                        if (renErr) {
                          self.error('이전 로그 파일을 옮기던 중 오류가 발생했습니다.');
                          reject(renErr);
                        } else { openFStream(renamedPath, i); }
                      });
                    } else {
                      // File access error
                      self.error('이전 로그 파일을 옮길 수 없어 새 로그 파일을 생성하지 못했습니다.');
                      reject(renAccErr);
                    }
                  } else {
                    // Renamed file already exists, try next number
                    renameLog(i + 1);
                  }
                });
              };
              renameLog(0);
            }
          } catch (logAccErr) {
            if (logAccErr.code === 'ENOENT') {
              // Log file not exists -> make & load log module
              openFStream(null, -1);
            } else {
              // log file cannot be accessed
              self.error('이전 로그 파일에 접근할 수 없어 새 로그 파일을 생성하지 못했습니다.');
              reject(logAccErr);
            }
          }
        }
      });
    });
  }

  get fsout(): WriteStream { return this.fstream; }

  fsw(data): void { if (this.fsout) this.fsout.write(data); }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private makeType = (data: any, title: string, titleColor?: keyof colors.Color,
    dataProcessor = (_): any => _): void => {
    // Prepare time and data
    const time = moment().format('YYYY MMM Do kk:mm:ss.SSS');
    const processedData = dataProcessor(data);
    const titleTab = title ? `${title}\t` : '';
    const titleArrow = (title ? `${title} > ` : '').bold;

    this.fsw(`${time}\t${titleTab}${colors.strip(processedData)}\n`);
    process.stdout.write(
      `${time.gray} ${(titleColor ? titleArrow[titleColor] : titleArrow)}${processedData}\n`,
    );
  }

  /**
   * Prints plain text.
   */
  plain = (data: any, title: string): void => {
    this.makeType(data, title);
  }

  /**
   * Prints info text.
   */
  info = (data: any, title?: string): void => {
    this.makeType(data, title || 'INFO', 'cyan');
  }

  /**
   * Prints error text.
   */
  error = (data: any, title?: string): void => {
    this.makeType(data, title || 'ERROR', 'red');
  }

  /**
   * Prints debugging text.
   */
  debug = (data: any, title?: string): void => {
    this.makeType(data, title || 'DEBUG', 'blue', (_) => (typeof _ === 'string' ? _ : util.format('%o', _)));
  }

  /**
   * Prints warning text.
   */
  warn = (data: any, title?: string): void => {
    this.makeType(data, title || 'WARN', 'yellow');
  }

  /**
   * Prints "okay(success)" text.
   */
  okay = (data: any, title?: string): void => {
    this.makeType(data, title || 'OKAY', 'green');
  }
}

export default Logger;
