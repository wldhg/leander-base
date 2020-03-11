/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

/* eslint-disable @typescript-eslint/no-explicit-any */

type LNDRBase = {
  config: LNDRConfig;
  cli: import('discord.js').Client;
  pkg: AppConfig;
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
}

interface LNDR extends LNDRBase {
  log: AppCoreLogFunction;
  version: string;
  util: AppCoreUtil;
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
    frontend: {
      domain?: string;
      port: number;
      https?: false;
    };
    backend: {
      domain: string;
      port?: number;
      tls?: {
        privkey: string;
        fullchain: string;
      };
    };
  };
  prefix: string;
  presence?: {
    timeout: number;
    active: {
      interval: number;
      list: LNDRPresence[];
    };
    rest?: {
      interval: number;
      list: LNDRPresence[];
    };
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
  init: (core: AppCore, lndr: LNDRBase, deps?: LNDRModuleDep) => Promise<void>;
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

type LNDRCommandSection = '커뮤니티' | '기타';

interface LNDRCommandMeta {
  section: LNDRCommandSection | null;
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

type LNDRCommandFunction = (lndr: LNDR, acts: LNDRActs, msg: LNDRParsedMessage) => void;

type LNDRCommandDeps = string[];

interface LNDRCommand {
  meta: LNDRCommandMeta;
  help: LNDRCommandHelp;
  fn: LNDRCommandFunction;
  deps: LNDRCommandDeps;
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
  reply?: (content: string) => Promise<import('discord.js').Message>;
  channel?: import('discord.js').Channel;
  author?: import('discord.js').User;
  guild?: import('discord.js').Guild;
  member?: import('discord.js').GuildMember;
}

type LNDRParsedMessageSegment = {
  type: string;
  data: string;
};
