import { HotBeveragePlugin } from "../hotbeverage";

import postcss from "postcss";
import autoprefixer from "autoprefixer";
import tailwindcss, { Config } from "tailwindcss";

export const tailwindcssplugin: (pattern:string[]) => HotBeveragePlugin = (pattern) => async (ctx) => {
    console.log("🌀 [tailwindcss] starting plugin")

    if (pattern === undefined) {
        console.log("🥊 WARNING : not pattern provided to the tailwindcss plugin")
        pattern = []
    }


    const files = ctx.vfs
        .match(pattern)
        .filter(item => item.content != null)
        .map(function(item) { return {"raw":item.content!.toString(), "extension":"html"}})

    console.log("🌀 [tailwindcss] parsing " + files.length + " files")

    await ctx.vfs.glob("**/*.css", async (vfs, item) => {      
        const config:Config = {
            content:[...files],
        }
        const css = new String(item.content)  
        const result = await postcss([autoprefixer, tailwindcss(config)]).process(css, { from: item.name, to: item.name })
        
        vfs.content(item.name, result.css)
    })

    console.log("🌀 [tailwindcss] end of plugin")

}