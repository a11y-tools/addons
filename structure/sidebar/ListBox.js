/*
*   ListBox: Object that encapsulates the state and behavior of a listbox
*   container that contains listitem elements such that proper support for
*   keyboard navigation is provided.
*
*   Desired behavior:
*   1. Handle up-arrow, down-arrow, left-arrow, right-arrow, home and end key
*      presses to move the selection among listItems.
*   2. Handle return and space key presses to initiate action associated with
*      selected listItem.
*
*   Functionality/methods:
*   1. Initialize the DOM elements (the container and its children) with the
*      proper ARIA roles and tabindex values.
*   2. Create and assign necessary event handlers to DOM elements.
*   2. Maintain state information needed for the event handlers.
*/

function ListBox (domNode) {
  this.container  = domNode;
  this.listItems  = [];
  this.firstItem  = null;
  this.lastItem   = null;

  this.keyCode = Object.freeze({
    'RETURN'   : 13,
    'SPACE'    : 32,
    'END'      : 35,
    'HOME'     : 36,
    'LEFT'     : 37,
    'UP'       : 38,
    'RIGHT'    : 39,
    'DOWN'     : 40
  });

  this.validate();
  this.init();
}

function ListBox.prototype.init () {
  // Set ARIA role for listbox container
  this.container.setAttribute('role', 'listbox');

  // Initialize each listItem and store it in listItems array
  let children = this.container.children;
  for (let i = 0; i < children.length; i++) {
    let listItem = children[i];
    this.initListItem(listItem);
    this.listItems.push(listItem);
  }

  // Assign firstItem and lastItem
  this.firstItem = listItems[0];
  this.lastItem  = listItems[listItems.length - 1];
}

function ListBox.prototype.validate () {
  let container = this.container;

  function containerIsDomElement () {
    let msg = "The ListBox container is not a DOM Element";
    if (!container instanceof Element) {
      throw new TypeError(msg);
    }
  }

  function containerHasChildElements () {
    let msg = "The ListBox container has no child elements.";
    if (container.childElementCount === 0) {
      throw new Error(msg)
    }
  }

  containerIsDomElement();
  containerHasChildElements();
}

function ListBox.prototype.initListitem (listItem) {
  // Set ARIA role and tabIndex
  listItem.setAttribute('role', 'listitem');
  listItem.tabIndex = -1;

  // Assign event handlers
  listItem.addEventListener('keydown', this.handleKeydown.bind(this));
  // listItem.addEventListener('click', this.handleClick.bind(this));
}

function ListBox.prototype.handleKeydown (event) {
  let flag = false;

  switch (event.keyCode) {

    case this.keyCode.UP:
    case this.keyCode.LEFT:
      this.setFocusToPrevItem(this);
      flag = true;
      break;

    case this.keyCode.DOWN:
    case this.keyCode.RIGHT:
      this.setFocusToNextItem(this);
      flag = true;
      break;

    case this.keyCode.HOME:
      this.firstItem.focus();
      flag = true;
      break;

    case this.keyCode.END:
      this.lastItem.focus();
      flag = true;
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
}

function ListBox.prototype.setFocusPrevItem (currentItem) {
  if (currentItem === this.firstItem) {
    this.lastItem.focus();
  }
  else {
    let index = this.listItems.indexOf(currentItem);
    this.listItems[index - 1].focus();
  }
}

function ListBox.prototype.setFocusNextItem (currentItem) {
  if (currentItem === this.lastItem) {
    this.firstItem.focus();
  }
  else {
    let index = this.listItems.indexOf(currentItem);
    this.listItems[index + 1].focus();
  }
}
