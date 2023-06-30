import * as nunjucks from "nunjucks"

import { HotBeverageData, HotBeveragePlugin } from "../hotbeverage";
import path from "path";
import { VFS } from "../vfs";


export interface Options {
    pattern?: string[],
    provider?: (data:HotBeverageData) => HotBeverageData,
    templatesPath? : string,
    extensions?: ((env:nunjucks.Environment, data:HotBeverageData, basedir:string, vfs:VFS, cache:Record<string, any>) => void) []

}

export const nunjucksplugin: (opts:Options) => HotBeveragePlugin = (options = {}) => async (ctx) => {
    console.log("🌀 [nunjucks] starting plugin")
    const defaults = {
        pattern:["**/*.njk"],
        provider: (data:HotBeverageData) => data,
        templatesPath: "./templates/",
        extensions:[]
    }

    const opts = {...defaults, ...options}

    const data = opts.provider(ctx.data)
    const context = {...data}

    const env = nunjucks.configure(path.join(ctx.basedir, opts.templatesPath))

    for (let extension of opts.extensions) {
        extension(env, context, ctx.basedir, ctx.vfs, ctx.cache)
    }

    for (const p of opts.pattern) {
        await ctx.vfs.glob(p, async (vfs, item) => {
            const str = item.content?.toString()
            if (str != null) {

                const promise = new Promise((resolve, reject) => {
                    console.log("🌀 [nunjucks] performing nunjucks rendering for ", item.name)
                    env.renderString(str, context, function(error, result) {
                        if (result) {
                            console.log("🌀 [nunjucks] registering nunjucks rendering for ", item.name)
                            vfs.content(item.name, result)
                            vfs.rename(item.name, item.name.replace(".njk", ""))
                            resolve(0)
                        }
                        if (error) {
                            console.log(error)
                            reject()
                        }
                    })
    
                })
                await promise

            }
        })
    }

}