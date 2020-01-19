/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

interface AppName {
  full: string
  abbr: string
}

type AppDirMaker = (structuredPath: string[]) => string
interface AppDir {
  DATA: string
  RES: string
  data: AppDirMaker
  res: AppDirMaker
}

interface AppFnItem {
  keyword: string
  abbr?: string
  description: string
  options: string[]
}
interface AppOptItem {
  flags: string[]
  type: 'string' | 'number' | 'flag'
  description: string
  required: boolean
  multiple?: boolean
  inputCount?: number
}
interface AppArg {
  fn: {
    default: AppFnItem
    [key: string]: AppFnItem
  }
  opt: {
    [key: string]: AppOptItem
  }
}
