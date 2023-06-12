import path from "path"
import { readFileSync, mkdirSync, writeFileSync } from "fs"

import { minimatch } from "minimatch"

interface FileItem {
    name:string,
    content:Buffer|null
}

type FileItemCallback = (vfs:VFS, item:FileItem) => void

export class VFS {

    public items: FileItem[] = []

    /**
     * import a existing file to the virtual file system
     * 
     * @param path a non null path to a existing file
     * @param name the name of the file
     */
    public import(filepath:string, name:string) {
        name = this.normalize(name)

        const item :FileItem = {
            name, content:readFileSync(filepath)
        }
        this.items.push(item)
    }

    /**
     * 
     * 
     */
    public async glob(pattern:string, callback:FileItemCallback) {
        for (let item of this.items) {
            if (minimatch(item.name, pattern)) {
                const result:any = callback(this, item)
                if (result instanceof Promise) {
                    await result
                }
            }
        }
    }

    public match(pattern:string[]) {
        const items:FileItem[] = []

        for (let item of this.items) {
            for (let p of pattern) {
                if (minimatch(item.name, p)) {
                    items.push(item)
                }
            }
        }
        return items;
    }


    public rename(from:string, to:string) {
        from = this.normalize(from)
        to = this.normalize(to)

        this.items.filter(item => item.name == from).forEach(item => { item.name = to })
    }

    public get(name:string): FileItem|null {
        name = this.normalize(name)

        let found = this.items.filter(item => item.name == name)
        if (found.length == 0) {
            return null;
        } else {
            return found[0];
        }
    }

    public add(name:string, content:string|Buffer) {
        name = this.normalize(name)

        if (content == null) {
            console.log("WARNING : VFS.add got content null content")
        } else {
            this.remove(name)
            const item:FileItem =  {
                name,
                content: Buffer.from(content)
            }
            this.items.push(item)    
        }
    }

    public remove(name:string) {
        name = this.normalize(name)
        this.items = this.items.filter(item => item.name != name)
    }

    public content(name:string, content:Buffer|string) {
        name = this.normalize(name)
        if (content == null) {
            console.log("WARNING : VFS.content : content is null for name = ", name)
        } else {
            let buffer = content instanceof Buffer ? content: Buffer.from(content)

            const item = this.get(name)
            if (item != null) {
                item.content = buffer
            }    
        }
    }

    public clear() {
        this.items = []
    }

    private normalize(filename:string): string {
        if (filename[0] == "/") {
            filename = filename.substring(1)
        }
        return filename
    }

    public writeto(dst:string) {
        console.log("writeto()")
        for (let item of this.items) {
            let fullpath = path.join("./build", item.name)
            let dir = path.dirname(fullpath)
            
            mkdirSync(dir, {recursive: true})
            if (item.content) {
                writeFileSync(fullpath, item.content)
            }
        }
    }
}