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
    const tabsArray = [];
    tabsArray.push(...this.shadowRoot.querySelectorAll('[role="tab"]'));
    return tabsArray;
  }

  get panels () {
    const panelsArray = [];
    panelsArray.push(...this.shadowRoot.querySelectorAll('[role="tabpanel"]'));
    return panelsArray;
  }
}

customElements.define('tab-set', TabSet);
export { TabSet };
