export const meta = {
  /**
   * Module ID string without any whitespace. This is also used as one of callable
   * commands.
   * @type {string}
   */
  moduleID: '',

  /**
   * Structured Help Message Format. If null, fallback text will be displayed.
   * @type {null|object}
   * @property {string} title
   * @property {string} description
   * @property {?object} fields Key will be the field title, values will be the body.
   * @property {?string[]} serverAdminPermissionRequired Names of fields which server
   *                                                     admin permission is required.
   * @property {?string[]} lndrAdminPermissionRequired Names of fields which leander
   *                                                   admin permission is required.
   */
  help: null,

  /**
   * A module must belong to one section. The first element will be appeared in `help`.
   * If nothing, this command will not be displayed in `help`.
   * @type {null|string}
   * @see module.js#sectionList
   */
  section: null,

  /**
   * A list of callable commands.
   */
  commands: [],

  /**
  * Permissions for executing this this feature.
  * @type {object}
  * @property {?string[]} author Permitted author id list.
  * @property {?string[]} channel Permitted channel id list.
  * @property {?boolean} DM If undefined, this cond will be disabled.
  * @property {?boolean} serverAdmin If false or undefined, this cond will be disabled.
  * @property {?boolean} lndrAdmin If false or undefined, this cond will be disabled.
  */
  conditions: {},
};

/**
 * Frequently used module actions.
 * This can accessed from other modules via `lndr.acts.[moduleID][utilName]`.
 * @param {Kernel} kernel Waai kernel object.
 * @param {Lndr} lndr Leander object without `lndr.commands`, `lndr.acts` and
 *                    `lndr.helpEmbed`.
 */
// eslint-disable-next-line no-unused-vars
export const actions = (kernel, lndr) => ({});

/**
 * Main function.
 * @param {Kernel} kernel Waai kernel object.
 * @param {Lndr} lndr Leander object.
 * @param {DISCORD.Message} msg Discord message object.
 */
// eslint-disable-next-line no-unused-vars
export const main = (kernel, lndr, msg) => {};
