/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

export enum MessageType {
  'DEFAULT', 'RECIPIENT_ADD', 'RECIPIENT_REMOVE', 'CALL', 'CHANNEL_NAME_CHANGE', 'CHANNEL_ICON_CHANGE', 'PINS_ADD', 'GUILD_MEMBER_JOIN'
}

export const checkPerm = (conds: string[], id: string): boolean => {
  let partialPermissionEngagement = true;

  conds.forEach((cond) => {
    if ((cond[0] === '!') && (id === cond.substring(1))) {
      partialPermissionEngagement = false;
    } else if ((cond[0] !== '!') && (id !== cond)) {
      partialPermissionEngagement = false;
    }
  });

  return partialPermissionEngagement;
};
