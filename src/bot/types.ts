/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable @typescript-eslint/no-explicit-any */

type LNDRModuleNames = 'dialog' | 'tools' | 'embed';

type LNDR = {
  config: LNDRConfig;
  cli: import('discord.js').Client;
  serverlock: {
    isException: (id: import('discord.js').Snowflake) => boolean;
    addException: (id: import('discord.js').Snowflake) => void;
    removeException: (id: import('discord.js').Snowflake) => void;
  };
  commands?: LNDRCommand[];
  modules?: LNDRModule[];
  hooks?: {
    [key in import('./message').MessageType]?: LNDRModuleHook[];
  };
  dummy: '\u200B';
  t: LNDRTranslateFunction;
  tDict: object;
  fn: {
    [key: string]: LNDRCommandFunction;
  };
  help: {
    [key: string]: LNDRCommandHelp;
  };
  meta: {
    [key: string]: LNDRCommandMeta;
  };
  helpEmbed?: import('discord.js').MessageEmbed;
  [key: string]: LNDRModuleActs | any;
}

interface LNDRConfig {
  discord: {
    token: string;
    clientID: import('discord.js').Snowflake;
    permission: string;
    adminID: string;
    invitable: boolean;
  };
  serverlock?: import('discord.js').Snowflake[];
  web?: {
    domain: string;
    port?: number;
    tls?: {
      key: string;
      cert: string;
    };
  };
  prefix: string;
  presence?: {
    interval: number;
    list: LNDRPresence[];
  };
  lang: 'ko-kr' | string;
  addressing: string;
  name: string;
  emoji?: string;
  point?: boolean;
}

type LNDRActivity = {
  name: string;
  type: import('discord.js').ActivityType;
  url?: string;
  shardID?: number | number[];
};
type LNDRPresence = string | LNDRActivity;

interface LNDRModule {
  name: string;
  init: (core: AppCore, lndr: LNDR, deps?: LNDRModuleDep) => Promise<void>;
  acts?: LNDRModuleActs;
  hooks?: LNDRModuleHook[];
}
interface LNDRModuleActs {
  [key: string]: (...args: any[]) => any;
}
interface LNDRModuleHook {
  on: import('./message').MessageType;
  checker: (msg: import('discord.js').Message) => Promise<LNDRModuleHookCheckResult>;
  fn: (msg: import('discord.js').Message) => void;
}
interface LNDRModuleHookCheckResult {
  triggered: boolean;
  preventDefault: boolean;
}
interface LNDRModuleDepNotResolved {
  module: LNDRModule;
  deps: string[];
  path: string;
}
interface LNDRModuleDep {
  [key: string]: LNDRModule;
}

interface LNDRCommandMeta {
  section: string | null;
  commands: string[];
  conditions: {
    DM?: boolean;
    channel?: string[];
    author?: string[];
    guild?: string[];
    lndrAdmin?: boolean;
    guildAdmin?: boolean;
  };
}

interface LNDRCommandHelp {
  title: string;
  description?: string;
  fields?: {
    [key: string]: string;
  };
  forServerAdmin?: string[];
  forLndrAdmin?: string[];
}

type LNDRCommandFunction = (core: AppCore, lndr: LNDR, msg: LNDRParsedMessage) => void;

interface LNDRCommand {
  meta: LNDRCommandMeta;
  help: LNDRCommandHelp;
  fn: LNDRCommandFunction;
}

type LNDRTranslateFunction = (sentence: string, ...args: string[]) => string;

interface LNDRParsedMessage {
  serial?: boolean;
  command?: string;
  rawContent?: string;
  segments?: LNDRParsedMessageSegment[];
  codeSegments?: LNDRParsedMessageSegment[];
  arguments?: string[];
  raw?: import('discord.js').Message;
  send?: (
      content?: import('discord.js').StringResolvable,
      options?: (import('discord.js').MessageOptions & { split: true | import('discord.js').SplitOptions }) | import('discord.js').MessageAdditions,
    ) => Promise<import('discord.js').Message[] | import('discord.js').Message>;
  channel?: import('discord.js').Channel;
  author?: import('discord.js').User;
  guild?: import('discord.js').Guild;
  member?: import('discord.js').GuildMember;
}

type LNDRParsedMessageSegment = {
  type: string;
  data: string;
};
