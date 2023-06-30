"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VFS = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const minimatch_1 = require("minimatch");
class VFS {
    constructor() {
        this.items = [];
    }
    /**
     * import a existing file to the virtual file system
     *
     * @param path a non null path to a existing file
     * @param name the name of the file
     */
    import(filepath, name) {
        name = this.normalize(name);
        const item = {
            name, content: (0, fs_1.readFileSync)(filepath)
        };
        this.items.push(item);
    }
    /**
     *
     *
     */
    glob(pattern, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let item of this.items) {
                if ((0, minimatch_1.minimatch)(item.name, pattern)) {
                    const result = callback(this, item);
                    if (result instanceof Promise) {
                        yield result;
                    }
                }
            }
        });
    }
    match(pattern) {
        const items = [];
        for (let item of this.items) {
            for (let p of pattern) {
                if ((0, minimatch_1.minimatch)(item.name, p)) {
                    items.push(item);
                }
            }
        }
        return items;
    }
    rename(from, to) {
        from = this.normalize(from);
        to = this.normalize(to);
        this.items.filter(item => item.name == from).forEach(item => { item.name = to; });
    }
    get(name) {
        name = this.normalize(name);
        let found = this.items.filter(item => item.name == name);
        if (found.length == 0) {
            return null;
        }
        else {
            return found[0];
        }
    }
    add(name, content) {
        name = this.normalize(name);
        if (content == null) {
            console.log("WARNING : VFS.add got content null content");
        }
        else {
            this.remove(name);
            const item = {
                name,
                content: Buffer.from(content)
            };
            this.items.push(item);
        }
    }
    remove(name) {
        name = this.normalize(name);
        this.items = this.items.filter(item => item.name != name);
    }
    content(name, content) {
        name = this.normalize(name);
        if (content == null) {
            console.log("WARNING : VFS.content : content is null for name = ", name);
        }
        else {
            let buffer = content instanceof Buffer ? content : Buffer.from(content);
            const item = this.get(name);
            if (item != null) {
                item.content = buffer;
            }
        }
    }
    clear() {
        this.items = [];
    }
    normalize(filename) {
        if (filename[0] == "/") {
            filename = filename.substring(1);
        }
        return filename;
    }
    writeto(dst) {
        for (let item of this.items) {
            let fullpath = path_1.default.join("./build", item.name);
            let dir = path_1.default.dirname(fullpath);
            (0, fs_1.mkdirSync)(dir, { recursive: true });
            if (item.content) {
                (0, fs_1.writeFileSync)(fullpath, item.content);
            }
        }
    }
}
exports.VFS = VFS;
