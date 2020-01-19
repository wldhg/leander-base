/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

interface AppArgAnalyzed {
  fn?: AppFnItem & {
    isDefault: boolean;
  };
  [key: string]: boolean | number | string | string[] | AppFnItem;
}
