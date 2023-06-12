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
exports.tailwindcssplugin = void 0;
const postcss_1 = __importDefault(require("postcss"));
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const tailwindcss_1 = __importDefault(require("tailwindcss"));
const tailwindcssplugin = (pattern) => (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🌀 [tailwindcss] starting plugin");
    if (pattern === undefined) {
        console.log("🥊 WARNING : not pattern provided to the tailwindcss plugin");
        pattern = [];
    }
    const files = ctx.vfs
        .match(pattern)
        .filter(item => item.content != null)
        .map(function (item) { return { "raw": item.content.toString(), "extension": "html" }; });
    console.log("🌀 [tailwindcss] parsing " + files.length + " files");
    yield ctx.vfs.glob("**/*.css", (vfs, item) => __awaiter(void 0, void 0, void 0, function* () {
        const config = {
            content: [...files],
        };
        const css = new String(item.content);
        const result = yield (0, postcss_1.default)([autoprefixer_1.default, (0, tailwindcss_1.default)(config)]).process(css, { from: item.name, to: item.name });
        vfs.content(item.name, result.css);
    }));
    console.log("🌀 [tailwindcss] end of plugin");
});
exports.tailwindcssplugin = tailwindcssplugin;
