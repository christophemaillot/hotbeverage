
import {  WebSocket, WebSocketServer } from "ws"

export class LiveReloadServer {

    private port:number
    private wss:WebSocketServer|null = null

    private ws:WebSocket|null = null

    constructor(port:number) {
        this.port = port
    }

    public run() {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on("connection", (ws) => {
            this.ws = ws
        });
    }

    public changed() {
        this.ws?.send("changed")    
    }
}