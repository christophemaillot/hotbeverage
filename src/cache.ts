


export class Cache {

    private cache:Record<string, any> = {}
    private hashes:Record<string, string> = {}

    public clear() {
        this.cache = {}
    }

    public async  get(key:string, hash:string, builder:()=>any): Promise<any> {
        if (key in this.cache) {
            const oldhash = this.hashes[key];
            if (oldhash == hash) {
                return this.cache[key]
            }
        }
        const content = await builder()
        this.cache[key] = content
        this.hashes[key] = hash
        
        return content
    }
}