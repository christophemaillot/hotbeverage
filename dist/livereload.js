"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveReloadServer = void 0;
const ws_1 = require("ws");
class LiveReloadServer {
    constructor(port) {
        this.wss = null;
        this.ws = null;
        this.port = port;
    }
    run() {
        this.wss = new ws_1.WebSocketServer({ port: this.port });
        this.wss.on("connection", (ws) => {
            this.ws = ws;
        });
    }
    changed() {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send("changed");
    }
}
exports.LiveReloadServer = LiveReloadServer;
