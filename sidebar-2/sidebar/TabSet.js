/*
*   TabSet.js
*
*   Compositional structure of custom elements:
*
*   TabSet [contains]
*     TabList (1) [contains]
*       TabButton [2 or more]
*     TabPanel [2 or more]
*/

function htmlTemplate (tplstr) {
  const template = document.createElement('template');
  template.innerHTML = tplstr;
  return template.content.cloneNode(true);
}

function styleElement (tplstr) {
  return `
    <style>
    ${tplstr}
    </style>
  `;
}

/*
*   TabSet
*/
const tabSetHtml = `
  <div class="tabs">
    <slot></slot>
    <slot name="panel"></slot>
  </div>
`;

class TabSet extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(htmlTemplate(tabSetHtml));
    this.buttons = [];
    this.panels = [];
  }

  register (element) {
    if (element instanceof HTMLButtonElement) {
      console.log(`register: ${element.id}`);
      this.buttons.push(element);
      return;
    }

    if (element instanceof HTMLDivElement) {
      console.log(`register: ${element.id}`);
      this.panels.push(element);
      return;
    }
  }

  get tabButtons () {
    return this.buttons;
  }

  get tabPanels () {
    return this.panels;
  }
}

/*
*   TabList
*/
const tabListHtml = `
  <div role="tablist">
    <slot></slot>
  </div>
`;

class TabList extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(htmlTemplate(tabListHtml));
  }

  register (element) {
    this.parentElement.register(element); // TabSet
  }
}

/*
*   TabButton: Initialize 'id', 'aria-controls', 'aria-selected' attributes.
*   Set 'aria-selected' to true for first button.
*/
const tabButtonHtml = `
  <button role="tab" type="button">
    <slot></slot>
  </button>
`;

const tabButtonCss = `
  #button-1 {
    color: red;
  }
  #button-2 {
    color: green;
  }
`;

class TabButton extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = styleElement(tabButtonCss);
    this.shadowRoot.appendChild(htmlTemplate(tabButtonHtml));
    this.button = this.shadowRoot.querySelector('button');
  }

  register (element) {
    this.parentElement.register(element); // TabList
  }

  static count = 0;
  connectedCallback () {
    TabButton.count++;
    this.button.setAttribute('id', `button-${TabButton.count}`);
    this.button.setAttribute('aria-controls', `panel-${TabButton.count}`);
    this.button.setAttribute('aria-selected', TabButton.count === 1 ? 'true' : 'false');
    this.register(this.button);
  }
}

/*
*   TabPanel: Initialize 'id', 'aria-labelledby' attributes.
*/
const tabPanelHtml = `
  <div role="tabpanel" tabindex="0">
    <slot></slot>
  </div>
`;

const tabPanelCss = `
  div[role="tabpanel"] {
    height: 100px;
    border: 1px solid #ddd;
    padding: 5px;
  }
`;

class TabPanel extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = styleElement(tabPanelCss);
    this.shadowRoot.appendChild(htmlTemplate(tabPanelHtml));
    this.panel = this.shadowRoot.querySelector('div[role="tabpanel"]');
  }

  register (element) {
    this.parentElement.register(element); // TabSet
  }

  static count = 0;
  connectedCallback () {
    TabPanel.count++;
    this.panel.setAttribute('id', `panel-${TabPanel.count}`);
    this.panel.setAttribute('aria-labelledby', `button-${TabPanel.count}`);
    this.register(this.panel);
  }
}

export { TabSet, TabList, TabButton, TabPanel };
