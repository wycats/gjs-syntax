// this file is the entry point for the vite dev mode server.

import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript.js";
import typescript from "highlight.js/lib/languages/typescript.js";
import "highlight.js/styles/github.css";
import { gjs, gts } from "./gbs/gts.js";
import gbs from "./gbs/html.js";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("gbs", gbs);
hljs.registerLanguage("gts", gts);
hljs.registerLanguage("gjs", gjs);

const code = `
import EmailContact from "./EmailContact";
import TelephoneContact from "./TelephoneContact";
import { Component } from "@glimmer/component";

export default class ContactComponent extends Component {
  <template>
    {{#match @contact}}
      {{:when "telephone" as |number|}}
        <TelephoneContact @number={{number}} />
      {{:when "email" as |email|}}
        <EmailContact @email={{email}} />
    {{/match}}
  </template>


  // smoke check

  import { on } from "@glimmer/modifiers";

  <template>
    {{a b (c d.e @f.g (h i.j @k.lmn.op) (nested.sexp with).dot.access) "qrs (tuv)"}}
    {{on "click" (toggleActive)}}
    {{@title}}
    {{if @is.active "is-active"}}

    {{#if (or true false)}}
      <p>This is true</p>

      {{#if another.nested}}
        <p>This shouldn't break out of the parent block.</p>
      {{else if (eq (yet.another) "another")}}
        <p>This, too, shouldn't break out of the parent block.</p>
      {{else}}
        <p>This, too, shouldn't break out of the parent block.</p>
      {{/if}}

      {{@this.is.true}}
    {{/if}}

    {{#let (some "special" thing) as |foo bar|}}

    {{/let}}

    <AsyncAwait @await={{(some value.here)}}>
      <:Loading></:Loading>
      <:Loaded as |user|>

      </:Loaded>
    </AsyncAwait>

    {{#match (some value.here)}}
    {{:Loading}}

    {{:Loaded as |user|}}
      <p>{{user.name}}</p>
    {{/match}}

    <img src="hello.png" alt="Hello" />
    <div class="{{if @is.active "is-active"}}" />

    <Box @is.active="isActive" />

    <p ...attributes>{{more true.stuff}}</p>

    {{yield}}

    <@some.component href="hello.html" @arg={{2}} />

    <f.input type="text" {{value @user.name}} />
  </template>
}
`;

const highlighted = hljs.highlight(code, { language: "gts" }).value;

const elementHighlighted = document.createElement("pre");
elementHighlighted.setAttribute("class", "hljs");
elementHighlighted.innerHTML = highlighted;

// const elementSource = document.createElement("pre");
// elementSource.setAttribute("class", "hljs-source");
// elementSource.innerText = highlighted;

app.appendChild(elementHighlighted);
// app.appendChild(elementSource);
