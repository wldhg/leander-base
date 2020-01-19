/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

interface LNDRConfig {
  discord: {
    token: string;
    clientID: string;
    permission: '305655160';
    adminID: string;
    invitable: boolean;
  };
  domain?: {
    name: string;
    port?: number;
    tls?: {
      key: string;
      cert: string;
    };
  };
  prefix: string;
  presence?: {
    interval: number;
    list: string | import('discord.js').PresenceData;
  };
}

interface LNDR {
  config: LNDRConfig;
  cli: import('discord.js').Client;
  modules?: LNDRModules;
  m?: LNDRModules;
  commands?: LNDRCommand[];
}
