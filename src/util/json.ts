/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

// JSON management module

/* eslint-disable import/extensions */
import util from 'util';
import fs from 'fs';
import mkdir from './mkdir';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Parse a json file.
 */
export const parse = (json: string, safeParse = false): Promise<object> => readFile(json)
  .then((raw) => JSON.parse(raw.toString()), (error) => {
    if (safeParse) {
      return {};
    }
    throw error;
  });

/**
 * Parse a json file. When failed to parse, an empty object will be returned.
 */
export const safeParse = (json: string): Promise<object> => parse(json, true);

/**
 * Saves javascript object to JSON file.
 */
export const save = (fPath: string, obj: object): Promise<void> => writeFile(
  fPath,
  JSON.stringify(obj),
).then(
  (_) => _,
  () => {
    mkdir(fPath).then(() => writeFile(
      fPath,
      JSON.stringify(obj),
    ));
  },
);

/**
 * Merges a javascript object to specified JSON file.
 */
export const merge = (path: string, obj: object, safeMerge = false): Promise<void> => parse(path,
  safeMerge).then(
  (ext) => {
    // Merge
    const assign = (fresh): object => (ext instanceof Array
      ? ext.concat(fresh)
      : Object.assign(ext, fresh));

    // Already file exists
    if (obj instanceof Promise) {
      return obj.then((res) => save(path, assign(res)));
    } return save(path, assign(obj));
  },
  () => {
    // File not exists, just save it
    if (obj instanceof Promise) return obj.then((res) => save(path, res));
    return save(path, obj);
  },
);

/**
 * Merges a javascript object to specified JSON file.
 * Parsing base JSON file will be done in safe mode.
 * @param {*} path Base JSON file path
 * @param {*} obj Javascript Object
 */
export const safeMerge = (path, obj): Promise<void> => merge(path, obj, true);
