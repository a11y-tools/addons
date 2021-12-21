/*
*   tabevents.js
*/

/*
*   TabEvents
*
*   (1) The constructor takes two arguments, both arrays of DOM elements that
*       are contained within a TabSet element.
*   (2) These arrays can be obtained from the TabSet element by calling its
*       'tabs' and 'panels' getters (e.g. 'let myTabs = tabSet.tabs').
*   (3) The getter methods return these as JavaScript arrays by converting
*       the nodeLists obtained with querySelectorAll using 'Array.from'.
*/
export default class TabEvents {
  constructor (tabs, panels) {
    this.tabs = tabs;
    this.panels = panels;

    for (let tab of this.tabs) {
      tab.addEventListener('click', this.clickHandler.bind(this));
      tab.addEventListener('keydown', this.keydownHandler.bind(this));
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
    console.log(`clickHandler: ${tab.id}`);
    this.activate(tab);
  }

  keydownHandler (event) {
    let key = event.key,
        tab = event.currentTarget;

    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    switch (key) {
      case 'Home':
        event.preventDefault();
        this.setFocusFirstTab();
        break;

      case 'End':
        event.preventDefault();
        this.setFocusLastTab();
        break;

      case 'ArrowLeft':
        this.setFocusPrevious(tab);
        break;

      case 'ArrowRight':
        this.setFocusNext(tab);
        break;

      // ArrowUp and ArrowDown are in keydown
      // because we need to prevent page scroll
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        break;

      case 'Enter':
      case ' ':
        this.activate(tab);
        break;
    }
  }

  findPanel (id) {
    return this.panels.find(panel => id === panel.id);
  }

  activate (tab) {
    this.deactivateTabs();
    tab.removeAttribute('tabindex');
    tab.setAttribute('aria-selected', 'true');

    const panelId = tab.getAttribute('aria-controls');
    console.log(`aria-controls: ${panelId}`);
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

  setFocusPrevious (tab) {
    let index = this.tabs.indexOf(tab);
    index = (index === 0) ? this.indexOfLastTab : index - 1;
    this.tabs[index].focus();
  }

  setFocusNext (tab) {
    let index = this.tabs.indexOf(tab);
    index = (index === this.indexOfLastTab) ? 0 : index + 1;
    this.tabs[index].focus();
  }
}
