/*
*   tabset.js
*/

import { styleTmpl, htmlTmpl } from './templates.js';

const template = document.createElement('template');
template.innerHTML = htmlTmpl;

class TabSet extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = styleTmpl;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback () {
    this._tabs = this.shadowRoot.querySelectorAll('[role="tab"]');
    this._panels = this.shadowRoot.querySelectorAll('[role="tabpanel"]');
  }
}

export { TabSet };
