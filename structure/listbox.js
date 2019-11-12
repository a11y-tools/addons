/*
*   ListBox: Object that encapsulates the state and behavior of a listbox
*   container with listitem elements in order to provide keyboard support
*   as recommended by ARIA Authoring Practices.
*
*   Desired behavior:
*   1. Handle up-arrow, down-arrow, left-arrow, right-arrow, home, end,
*      page-up and page-down key presses to move focus among listItems.
*   2. Handle return and space key presses to initiate the desired action
*      associated with the selected listItem.
*
*   Functionality/methods:
*   1. Initialize the DOM elements (the container and its children) with the
*      proper ARIA roles and tabindex values.
*   2. Create and assign necessary event handlers to DOM elements.
*   2. Maintain state information needed for the event handlers.
*/

function ListBox (domNode) {
  this.container = domNode;
  this.listItems = [];
  this.firstItem = null;
  this.lastItem  = null;
  this.increment = 8;

  this.keyCode = Object.freeze({
    'RETURN'   : 13,
    'SPACE'    : 32,
    'PAGEUP'   : 33,
    'PAGEDOWN' : 34,
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

//-------------------
//     validate
//-------------------

ListBox.prototype.validate = function () {
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
};

//-------------------
//       init
//-------------------

ListBox.prototype.init = function () {
  // Set ARIA role for listbox container
  this.container.setAttribute('role', 'listbox');

  // Configure each listItem and store it in listItems array
  let children = this.container.children;

  for (let i = 0; i < children.length; i++) {
    let listItem = children[i];
    this.configure(listItem);
    this.listItems.push(listItem);
  }

  // Assign firstItem and lastItem
  this.firstItem = this.listItems[0];
  this.lastItem  = this.listItems[this.listItems.length - 1];

  // Handle keydown events when container has focus
  this.container.addEventListener('keydown', this.handleContainerKeydown.bind(this));
};

//-------------------
//     configure
//-------------------

ListBox.prototype.configure = function (listItem) {
  // Set ARIA role and tabIndex
  listItem.setAttribute('role', 'listitem');
  listItem.tabIndex = -1;

  // Assign event handlers
  listItem.addEventListener('keydown', this.handleItemKeydown.bind(this));
  // listItem.addEventListener('click', this.handleClick.bind(this));
};

//----------------------------
//   handleContainerKeydown
//----------------------------

ListBox.prototype.handleContainerKeydown = function (event) {
  let flag = false;

  switch (event.keyCode) {

    case this.keyCode.LEFT:
    case this.keyCode.UP:
    case this.keyCode.RIGHT:
    case this.keyCode.DOWN:
      this.setFocusFirstItem();
      flag = true;
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
}

//-----------------------
//   handleItemKeydown
//-----------------------

ListBox.prototype.handleItemKeydown = function (event) {
  let flag = false;

  switch (event.keyCode) {

    case this.keyCode.LEFT:
    case this.keyCode.UP:
      this.setFocusPrevItem(event.target);
      flag = true;
      break;

    case this.keyCode.RIGHT:
    case this.keyCode.DOWN:
      this.setFocusNextItem(event.target);
      flag = true;
      break;

    case this.keyCode.PAGEUP:
      this.setFocusPrevPage(event.target);
      flag = true;
      break;

    case this.keyCode.PAGEDOWN:
      this.setFocusNextPage(event.target);
      flag = true;
      break;

    case this.keyCode.HOME:
      this.setFocusFirstItem();
      flag = true;
      break;

    case this.keyCode.END:
      this.setFocusLastItem();
      flag = true;
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

//----------------------
//   setFocus methods
//----------------------

ListBox.prototype.setFocusFirstItem = function () {
  this.firstItem.focus();
};

ListBox.prototype.setFocusLastItem = function () {
  this.lastItem.focus();
};

ListBox.prototype.setFocusPrevItem = function (currentItem) {
  if (currentItem === this.firstItem) return;

  let index = this.listItems.indexOf(currentItem);
  this.listItems[index - 1].focus();
};

ListBox.prototype.setFocusNextItem = function (currentItem) {
  if (currentItem === this.lastItem) return;

  let index = this.listItems.indexOf(currentItem);
  this.listItems[index + 1].focus();
};

ListBox.prototype.setFocusPrevPage = function (currentItem) {
  if (currentItem === this.firstItem) return;

  let index = this.listItems.indexOf(currentItem);
  let tgtIndex = index - this.increment;

  if (tgtIndex < 0) {
    this.firstItem.focus();
  }
  else {
    this.listItems[tgtIndex].focus();
  }
}

ListBox.prototype.setFocusNextPage = function (currentItem) {
  if (currentItem === this.lastItem) return;

  let index = this.listItems.indexOf(currentItem);
  let tgtIndex = index + this.increment;

  if (tgtIndex > this.listItems.length - 1) {
    this.lastItem.focus();
  }
  else {
    this.listItems[tgtIndex].focus();
  }
}
