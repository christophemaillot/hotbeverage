import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'

import * as mime from 'mime-types'
import * as chokidar from 'chokidar'
import * as yargs from 'yargs'

import { VFS } from "./vfs"
import { LiveReloadServer } from './livereload'
import { Cache } from './cache'


export interface HotBeverageContext {
    basedir:string,
    vfs:VFS,
    data:HotBeverageData,
    cache:Cache,
}

export interface HotBeverageOptions {
    port:Number,
    interface:string,
    indexFile:string,
    watch:string[],
    livereload: boolean,
    livereloadPort: number,
    livereloadExtensions: string[],
}

export type HotBeveragePlugin = (ctx:HotBeverageContext) => void | Promise<void>

export type HotBeverageData = {
    [key: string]: boolean | string | number | HotBeverageData;
};

var walk = function(dir:string, root:string|null = null) {
    if (root == null) {
        root = dir
    }
    var results:string[] = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file, root));
        } else { 
            results.push(file.substring((root?.length ?? 0) + 1));
        }
    });
    return results;
}

/**
 * A HotBeverage engine.
 * 
 */
export class HotBeverage {

    // current instance options
    private options:HotBeverageOptions;

    // attached virtual filesystem
    private vfs:VFS = new VFS();

    // the data structure, holding user defined data
    private data:HotBeverageData = {}

    // the HotBeverage basedir
    private basedir:string = path.resolve(".")

    // ordered list of plugins
    private plugins: HotBeveragePlugin[] = []

    // a general purpose cache instance, passed to every plugins
    private cache:Cache = new Cache()

    /**
     * Initialize a HotBeverage instance with default options.
     * 
     */
    constructor() {
        this.options = {
            port: 4000, 
            interface:"127.0.0.1",
            indexFile: "index.html",
            watch:["src/**/*"],
            livereloadPort: 5233,
            livereload: true,
            livereloadExtensions: [".html", ".htm"]
        }
    }

    /**
     * Register a source path.
     * The implementation actually register a built-in plugin.
     * 
     * @param srcpath a path to a source directory
     * @returns 
     */
    public src(srcpath:string): HotBeverage {

        // a built-in src pluging
        const plugin:HotBeveragePlugin = (ctx) => {
            const fullpath = path.resolve(srcpath)
            if (fs.existsSync(fullpath)) {
                const list = walk(fullpath)
                for (let file of list) {
                    ctx.vfs.import(path.join(srcpath, file), file)
                }
            } else {
                this.error(`path ${fullpath} not found`)
            }    
        }

        this.plugins.push(plugin)

        return this
    }

    public watch(patterns:string[]): HotBeverage {
        this.options.watch = patterns
        return this;
    }
    
    /**
     * Register a plugin.
     * 
     * @param p a plugin
     * @returns the current HotBeverage instance
     */
    public plugin(p:HotBeveragePlugin): HotBeverage {
        this.plugins.push(p)
        return this
    }


    private async rebuild() { 
        console.log("📚 triggering rebuild")
        this.vfs.clear()
        const ctx:HotBeverageContext =  { 
            vfs:this.vfs, 
            data:this.data,
            basedir:this.basedir,
            cache:this.cache,
        }
        for (let plugin of this.plugins) {
            let res = plugin(ctx)
            if (res instanceof Promise) {
                await res;
            }
        }
    }

    public async build() {
        await this.rebuild()
        this.vfs.writeto("./build")
    }


    public serve() {

        console.log("🧲 watching pattern : ", this.options.watch)

        // starts the livereload server
        const livereload = new LiveReloadServer(this.options.livereloadPort);
        livereload.run()

        // watch changes
        const watcher_handler = async (event:any, path:any) => {
            await this.rebuild()
            livereload.changed()
        }

        const watcher = chokidar.watch(this.options.watch, {
            interval: 200,
            ignoreInitial: true,
        })
        watcher.on('all', watcher_handler)
        setTimeout(watcher_handler, 50)

        // start http server
        const server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {

            if (request.url) {
                let url = request.url
                if (url[0] == "/") {
                    url = url.substring(1)
                }

                if (url == "") {
                    url = this.options.indexFile;
                }

                if (url.endsWith("/")) {
                    url = url + this.options.indexFile
                }

                let item = this.vfs.get(url)
                if (item != null) {

                    let buff = item.content

                    if (this.options.livereload) {
                        for (let ext of this.options.livereloadExtensions) {
                            if (item.name.endsWith(ext)) {
                                // inject script in buffer
                                if (buff != null) {
                                    let html = buff.toString('utf-8')
                                    html = html.replace("</body>", `<script>new WebSocket("ws://localhost:${this.options.livereloadPort}/").onmessage = (e) =>window.location.reload()</script> \n</body>`);
                                    buff = Buffer.from(html)
                                }
                            }
                        }
                    }

                    response.setHeader("Content-Length", buff?.length ?? 0)

                    let mimetype = mime.lookup(url)
                    if (mimetype !== false) {
                        response.setHeader("Content-Type", mimetype)
                    }
                    
                    response.end(buff)                    
                } else {
                    response.statusCode = 404
                    response.end("<p>Not found</p>")
                }
            } else {
                response.statusCode = 500
                response.end("<p>Server error</p>")
        }
        });
           
        server.listen(this.options.port, () => {
            console.log(`🌏 Server starting up at http://localhost:${this.options.port}/`);
        });
    }

    public run() {
        
        const serve_options = { }
        const build_options = { }
        const zip_options = { }

        const serve_callback = (args:any) => {
            this.serve()
        }
        const build_callback = (args:any) => {
            this.build()
        }
        const zip_callback = (args:any) => {
            console.log("zip", args)
        }

        yargs
            .command("serve", "run the development server", serve_options, serve_callback)
            .command("build", "build the static website in the output directory", build_options, build_callback)
            .command("zip", "build a zip file of the static website", zip_options, zip_callback)
            .argv
    }

    private error(message:string, icon:string = "❌") {
        console.log(icon, message)
        process.exit(-1)
    }
}