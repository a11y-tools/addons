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

  get tabs () {
    return Array.from(this.shadowRoot.querySelectorAll('[role="tab"]'));
  }

  get panels () {
    return Array.from(this.shadowRoot.querySelectorAll('[role="tabpanel"]'));
  }
}

customElements.define('tab-set', TabSet);
export { TabSet };
