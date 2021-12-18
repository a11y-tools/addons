/*
*   TabEvents.js
*/

export default class TabEvents {
  constructor (tabs, panels) {
    this.tabs = tabs;
    this.panels = panels;

    console.log(`this.tabs.length: ${this.tabs.length}`);
    console.log(`this.panels.length: ${this.panels.length}`);

    for (let tab of this.tabs) {
      tab.addEventListener('click', this.clickHandler.bind(this));
      tab.addEventListener('keydown', this.keydownHandler.bind(this));
      tab.addEventListener('keyup', this.keyupHandler.bind(this));
    }

    this.firstTab = this.tabs[0];
    this.indexOfLastTab = this.tabs.length - 1;
    this.lastTab = this.tabs[this.indexOfLastTab];
  }

  logArrays () {
    console.log('logArrays...');
    for (let t of this.tabs) {
      console.log('tab: ', t.id);
    }
    for (let p of this.panels) {
      console.log('panel: ', p.id)
    }
  }

  clickHandler (event) {
    let tab = event.currentTarget;
    console.log(`clickHandler tab.id: ${tab.id}`);
    this.activate(tab);
  }

  keydownHandler (event) {
    let key = event.key;

    switch (key) {
      case 'Home':
        event.preventDefault();
        setFocusFirstTab();
        break;

      case 'End':
        event.preventDefault();
        setFocusLastTab();
        break;

      // ArrowUp and ArrowDown are in keydown
      // because we need to prevent page scroll
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        break;
    }
  }

  keyupHandler (event) {
    let key = event.key,
        tab = event.currentTarget;

    switch (key) {
      case 'ArrowLeft':
        setFocusPrevious(tab);
        break;

      case 'ArrowRight':
        setFocusNext(tab);
        break;

      case 'Enter':
      case ' ':
        activate(tab);
        break;
    }
  }

  findPanel (id) {
    for (let panel of this.panels) {
      if (panel.id === id) {
        console.log('panel.id', panel.id);
        return panel;
      }
    }
  }

  activate (tab) {
    this.deactivateTabs();
    tab.removeAttribute('tabindex');
    tab.setAttribute('aria-selected', 'true');

    const panelId = tab.getAttribute('aria-controls');
    console.log(`aria-controls: ${panelId}`);
    /*
    const index = this.panels.findIndex(item => item.id === panelId);
    this.panels[index].classList.remove('is-hidden');
    */
    this.findPanel(panelId).classList.remove('is-hidden');
    tab.focus();
  }

  deactivateTabs () {
    for (let tab of this.tabs) {
      tab.setAttribute('tabindex', '-1');
      tab.setAttribute('aria-selected', 'false');
    }

    for (let panel of this.panels) {
      panel.classList.add('is-hidden');
    }
  }

  setFocusFirstTab () {
    this.firstTab.focus();
  }

  setFocusLastTab () {
    this.lastTab.focus();
  }

  getIndex (tab) {
    return this.tabs.findIndex(item => item.id === tab.id);
  }

  setFocusPrevious (tab) {
    let index = this.getIndex(tab);
    index = (index === 0) ? this.indexOfLastTab : index - 1;
    this.tabs[index].focus();
  }

  setFocusNext (tab) {
    let index = this.getIndex(tab);
    index = (index === this.indexOfLastTab) ? 0 : index + 1;
    this.tabs[index].focus();
  }
}
