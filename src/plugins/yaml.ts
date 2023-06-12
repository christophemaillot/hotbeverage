import { HotBeveragePlugin } from "../hotbeverage";

import * as path from 'path'
import * as fs from 'fs'

import * as YAML from 'yaml'


export const yamlplugin: (filepaths:string[]) => HotBeveragePlugin = (filepaths) => async (ctx) => {
    for (let filepath of filepaths) {
        const content = fs.readFileSync(path.join(ctx.basedir, filepath), 'utf8')
        const data = YAML.parse(content)
        ctx.data = { ...ctx.data, ...data}
    }
}