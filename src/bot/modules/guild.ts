import yml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import DISCORD from 'discord.js';

let kernel;
let lndr;

const pathScheme = (guild, group) => {
  let name;
  if (guild instanceof DISCORD.Guild) {
    name = group && group.length > 0 ? `${group}.yml` : 'db.yml';
  } else {
    throw kernel.err.make('Invalid guild object.');
  }
  return path.join(
    kernel.config.dir.guild,
    guild.id,
    name,
  );
};

const pathSchemeFull = (guild, group) => path.join(
  kernel.config.dir.base,
  pathScheme(guild, group),
);

export const registerMessageTypeHandler = (guild, type, handler) => {

};

export const onMessageType = (guild, type) => {

};

export const loadData = (guild, group) => {
  const data = {};
  try {
    const raw = fs.readFileSync(pathSchemeFull(guild, group), { encoding: 'utf-8' });
    Object.assign(data, yml.safeLoad(raw));
  } catch (readErr) {
    kernel.log.warn('guild::loadData - Failed to load guild data.');
    kernel.log.debug(readErr);
  }
  return data;
};

export const loadPartialData = (guild, key, group) => {
  const data = loadData(guild, group);
  return data[key] || null;
};

export const saveData = (guild, data, group) => kernel.util.mkdir(
  kernel.config.dir.base,
  path.join(
    kernel.config.dir.guild,
    guild.id,
  ),
).then(() => {
  try {
    fs.writeFileSync(pathSchemeFull(guild, group), yml.safeDump(data));
  } catch (writeErr) {
    kernel.err.parse('guild::saveData - Failed to open write stream.')(writeErr);
  }
  return data;
}, kernel.err.parse('guild::saveData - Failed to create target data directory.'));

export const savePartialData = (guild, key, value, group) => {
  const data = loadData(guild, group);
  data[key] = value;
  return saveData(guild, data, group);
};

export const init = (_kernel, _lndr) => {
  kernel = _kernel;
  lndr = _lndr;

  lndr.loadGuildData = loadData;
  lndr.saveGuildData = saveData;
  lndr.loadPartialGuildData = loadPartialData;
  lndr.savePartialGuildData = savePartialData;

  return lndr;
};
