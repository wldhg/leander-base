/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as DISCORD from 'discord.js';

const exceptionUsers = new Set<DISCORD.Snowflake>();

export const isException = (id: DISCORD.Snowflake): boolean => exceptionUsers.has(id);

export const addException = (id: DISCORD.Snowflake): void => {
  exceptionUsers.add(id);
};

export const removeException = (id: DISCORD.Snowflake): void => {
  exceptionUsers.delete(id);
};
