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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nunjucksplugin = void 0;
const nunjucks = __importStar(require("nunjucks"));
const path_1 = __importDefault(require("path"));
const nunjucksplugin = (options = {}) => (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🌀 [nunjucks] starting plugin");
    const defaults = {
        pattern: ["**/*.njk"],
        provider: (data) => data,
        templatesPath: "./templates/",
        extensions: []
    };
    const opts = Object.assign(Object.assign({}, defaults), options);
    const data = opts.provider(ctx.data);
    const context = Object.assign({}, data);
    const env = nunjucks.configure(path_1.default.join(ctx.basedir, opts.templatesPath));
    for (let extension of opts.extensions) {
        extension(env, context, ctx.basedir, ctx.vfs);
    }
    for (const p of opts.pattern) {
        yield ctx.vfs.glob(p, (vfs, item) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const str = (_a = item.content) === null || _a === void 0 ? void 0 : _a.toString();
            if (str != null) {
                const promise = new Promise((resolve, reject) => {
                    console.log("🌀 [nunjucks] performing nunjucks rendering for ", item.name);
                    env.renderString(str, context, function (error, result) {
                        if (result) {
                            console.log("🌀 [nunjucks] registering nunjucks rendering for ", item.name);
                            vfs.content(item.name, result);
                            vfs.rename(item.name, item.name.replace(".njk", ""));
                            resolve(0);
                        }
                        if (error) {
                            console.log(error);
                            reject();
                        }
                    });
                });
                console.log("🌀 [nunjucks] awaiting promise");
                yield promise;
                console.log("🌀 [nunjucks] awaiting promise done");
            }
        }));
    }
    console.log("🌀 [nunjucks] end of plugin");
});
exports.nunjucksplugin = nunjucksplugin;
