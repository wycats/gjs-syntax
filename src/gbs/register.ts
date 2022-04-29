import hljs, { type HLJSApi } from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript.js";
import typescript from "highlight.js/lib/languages/typescript.js";
import { gjs, gts } from "./gts.js";
import gbs from "./html.js";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("gbs", gbs);
hljs.registerLanguage("gts", gts);
hljs.registerLanguage("gjs", gjs);
// hljs.highlightAll();

declare global {
  var hljs: HLJSApi;
}

globalThis.hljs = hljs;
