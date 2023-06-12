"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotBeverage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const mime = __importStar(require("mime-types"));
const chokidar = __importStar(require("chokidar"));
const yargs = __importStar(require("yargs"));
const vfs_1 = require("./vfs");
const livereload_1 = require("./livereload");
var walk = function (dir, root = null) {
    if (root == null) {
        root = dir;
    }
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        var _a;
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file, root));
        }
        else {
            results.push(file.substring(((_a = root === null || root === void 0 ? void 0 : root.length) !== null && _a !== void 0 ? _a : 0) + 1));
        }
    });
    return results;
};
/**
 * A HotBeverage engine.
 *
 */
class HotBeverage {
    /**
     * Initialize a HotBeverage instance with default options.
     *
     */
    constructor() {
        // attached virtual filesystem
        this.vfs = new vfs_1.VFS();
        // the data structure, holding user defined data
        this.data = {};
        // the HotBeverage basedir
        this.basedir = path.resolve(".");
        // ordered list of plugins
        this.plugins = [];
        this.options = {
            port: 4000,
            interface: "127.0.0.1",
            indexFile: "index.html",
            watch: ["src/**/*"],
            livereloadPort: 5233,
            livereload: true,
            livereloadExtensions: [".html", ".htm"]
        };
    }
    /**
     * Register a source path.
     * The implementation actually register a built-in plugin.
     *
     * @param srcpath a path to a source directory
     * @returns
     */
    src(srcpath) {
        // a built-in src pluging
        const plugin = (ctx) => {
            const fullpath = path.resolve(srcpath);
            if (fs.existsSync(fullpath)) {
                const list = walk(fullpath);
                for (let file of list) {
                    ctx.vfs.import(path.join(srcpath, file), file);
                }
            }
            else {
                this.error(`path ${fullpath} not found`);
            }
        };
        this.plugins.push(plugin);
        return this;
    }
    watch(patterns) {
        this.options.watch = patterns;
        return this;
    }
    /**
     * Register a plugin.
     *
     * @param p a plugin
     * @returns the current HotBeverage instance
     */
    plugin(p) {
        this.plugins.push(p);
        return this;
    }
    rebuild() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("📚 triggering rebuild");
            this.vfs.clear();
            const ctx = {
                vfs: this.vfs,
                data: this.data,
                basedir: this.basedir,
            };
            for (let plugin of this.plugins) {
                let res = plugin(ctx);
                if (res instanceof Promise) {
                    yield res;
                }
            }
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.rebuild();
            this.vfs.writeto("./build");
        });
    }
    serve() {
        console.log("🧲 watching pattern : ", this.options.watch);
        // starts the livereload server
        const livereload = new livereload_1.LiveReloadServer(this.options.livereloadPort);
        livereload.run();
        // watch changes
        const watcher_handler = (event, path) => __awaiter(this, void 0, void 0, function* () {
            yield this.rebuild();
            livereload.changed();
        });
        const watcher = chokidar.watch(this.options.watch, {
            interval: 200,
            ignoreInitial: true,
        });
        watcher.on('all', watcher_handler);
        setTimeout(watcher_handler, 50);
        // start http server
        const server = http.createServer((request, response) => {
            var _a;
            if (request.url) {
                let url = request.url;
                if (url[0] == "/") {
                    url = url.substring(1);
                }
                if (url == "") {
                    url = this.options.indexFile;
                }
                if (url.endsWith("/")) {
                    url = url + this.options.indexFile;
                }
                let item = this.vfs.get(url);
                if (item != null) {
                    let buff = item.content;
                    if (this.options.livereload) {
                        for (let ext of this.options.livereloadExtensions) {
                            if (item.name.endsWith(ext)) {
                                // inject script in buffer
                                if (buff != null) {
                                    let html = buff.toString('utf-8');
                                    html = html.replace("</body>", `<script>new WebSocket("ws://localhost:${this.options.livereloadPort}/").onmessage = (e) =>window.location.reload()</script> \n</body>`);
                                    buff = Buffer.from(html);
                                }
                            }
                        }
                    }
                    response.setHeader("Content-Length", (_a = buff === null || buff === void 0 ? void 0 : buff.length) !== null && _a !== void 0 ? _a : 0);
                    let mimetype = mime.lookup(url);
                    if (mimetype !== false) {
                        response.setHeader("Content-Type", mimetype);
                    }
                    response.end(buff);
                }
                else {
                    response.statusCode = 404;
                    response.end("<p>Not found</p>");
                }
            }
            else {
                response.statusCode = 500;
                response.end("<p>Server error</p>");
            }
        });
        server.listen(this.options.port, () => {
            console.log(`🌏 Server starting up at http://localhost:${this.options.port}/`);
        });
    }
    run() {
        const serve_options = {};
        const build_options = {};
        const zip_options = {};
        const serve_callback = (args) => {
            this.serve();
        };
        const build_callback = (args) => {
            this.build();
        };
        const zip_callback = (args) => {
            console.log("zip", args);
        };
        yargs
            .command("serve", "run the development server", serve_options, serve_callback)
            .command("build", "build the static website in the output directory", build_options, build_callback)
            .command("zip", "build a zip file of the static website", zip_options, zip_callback)
            .argv;
    }
    error(message, icon = "❌") {
        console.log(icon, message);
        process.exit(-1);
    }
}
exports.HotBeverage = HotBeverage;
