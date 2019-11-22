/*
*   ListBox: Object that encapsulates the state and behavior of a listbox
*   container with option role elements in order to provide keyboard support
*   as recommended by ARIA Authoring Practices.
*
*   Desired behavior:
*   1. Handle focus of the listbox container
*   2. Handle up-arrow, down-arrow, left-arrow, right-arrow, home, end,
*      page-up and page-down key presses to move selection among options.
*   3. Handle mouse click for selecting an option.
*   4. Handle return and space key presses to initiate the desired action
*      associated with the selected option.
*
*   Functionality/methods:
*   1. Initialize the DOM elements (the container and its children) with the
*      proper ARIA roles.
*   2. Create and assign necessary event handlers for the ListBox container.
*   3. Maintain state information needed for the event handlers and set or
*      remove ARIA attributes such as aria-activedescendant and aria-selected
*      to reflect the listbox state.
*/

function ListBox (domNode, notifyFn) {
  this.container      = domNode;
  this.notifyFn       = notifyFn;

  this.optionsList    = [];
  this.selectedOption = null;
  this.firstOption    = null;
  this.lastOption     = null;
  this.increment      = 6;

  this.validate();
  this.init();
}

//-------------------
//     validate
//-------------------

ListBox.prototype.validate = function () {
  let listBox = this.container;

  function listBoxIsDomElement () {
    let msg = "The ListBox is not a DOM Element";
    if (!listBox instanceof Element) {
      throw new TypeError(msg);
    }
  }

  function listBoxHasChildElements () {
    let msg = "The ListBox has no child elements.";
    if (listBox.childElementCount === 0) {
      throw new Error(msg)
    }
  }

  listBoxIsDomElement();
  listBoxHasChildElements();
};

//-------------------
//       init
//-------------------

ListBox.prototype.init = function () {
  // Set ARIA attributes
  this.container.setAttribute('role', 'listbox');
  this.container.setAttribute('aria-activedescendant', '');

  // Configure each option and store it in optionsList array
  let children = this.container.children;

  for (let i = 0; i < children.length; i++) {
    let option = children[i];
    this.configure(option, i);
    this.optionsList.push(option);
  }

  // Use optionsList to set firstOption and lastOption
  let length = this.optionsList.length;
  this.firstOption = this.optionsList[0];
  this.lastOption  = this.optionsList[length - 1];

  this.assignEventHandlers();
};

//-------------------
//     configure
//-------------------

ListBox.prototype.configure = function (option, i) {
  let prefix = 'opt-';

  // Set ARIA role and id
  option.setAttribute('role', 'option');
  option.setAttribute('id', prefix + i);
};

//-------------------------
//   assignEventHandlers
//-------------------------

ListBox.prototype.assignEventHandlers = function () {
  let listBox = this.container;

  // Handle keydown events
  listBox.addEventListener('focus', this.handleFocus.bind(this));
  listBox.addEventListener('keydown', this.handleKeydown.bind(this));
  listBox.addEventListener('click', this.handleClick.bind(this));
  listBox.addEventListener('dblclick', this.handleDblClick.bind(this));
}

//-------------------
//    handleFocus
//-------------------

ListBox.prototype.handleFocus = function (event) {
  if (this.selectedOption === null) {
    this.setSelected(this.firstOption);
  }
  else {
    this.setSelected(this.selectedOption);
  }

  event.stopPropagation();
  event.preventDefault();
}

//-------------------
//   handleKeydown
//-------------------

ListBox.prototype.handleKeydown = function (event) {
  let flag = false;

  switch (event.key) {

    // Navigation keys
    case 'ArrowLeft':
    case 'ArrowUp':
      this.selectPrevOption();
      flag = true;
      break;

    case 'ArrowRight':
    case 'ArrowDown':
      this.selectNextOption();
      flag = true;
      break;

    case 'PageUp':
      this.selectPrevPage();
      flag = true;
      break;

    case 'PageDown':
      this.selectNextPage();
      flag = true;
      break;

    case 'Home':
      this.selectFirstOption();
      flag = true;
      break;

    case 'End':
      this.selectLastOption();
      flag = true;
      break;

    // Activation keys
    case 'Enter':
    case ' ':
      this.activateSelection();
      flag = true;
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};

//-------------------
//    handleClick
//-------------------

ListBox.prototype.handleClick = function (event) {
  let parentElement = event.target.parentElement;

  if (parentElement.getAttribute('role') === 'option') {
    this.setSelected(parentElement);
  }

  event.stopPropagation();
  event.preventDefault();
};

//----------------------
//    handleDblClick
//----------------------

ListBox.prototype.handleDblClick = function (event) {
  this.activateSelection();
}

//-------------------
//    setSelected
//-------------------

ListBox.prototype.setSelected = function (option) {
  if (this.selectedOption) {
    this.selectedOption.removeAttribute('aria-selected')
  }

  this.selectedOption = option;
  option.setAttribute('aria-selected', 'true');
  this.container.setAttribute('aria-activedescendant', option.id);
  this.scrollSelectedOption();
  this.notifyFn({
    action: 'navigate',
    index: this.optionsList.indexOf(this.selectedOption)
  });
}

//--------------------------
//   scrollSelectedOption
//--------------------------

ListBox.prototype.scrollSelectedOption = function () {
  let listbox = this.container;
  let element = this.selectedOption;

  // Note: element.offsetTop is the number of pixels from the top of the
  // closest relatively positioned parent element. Thus the CSS for the
  // ListBox container element must specify 'position: relative'.

  if (listbox.scrollHeight > listbox.clientHeight) {

    let elementBottom = element.offsetTop + element.offsetHeight;
    let scrollBottom = listbox.clientHeight + listbox.scrollTop;

    if (elementBottom > scrollBottom) {
      listbox.scrollTop = elementBottom - listbox.clientHeight;
    }
    else if (element.offsetTop < listbox.scrollTop) {
      listbox.scrollTop = element.offsetTop;
    }
  }
}

//--------------------------
//    activateSelection
//--------------------------

ListBox.prototype.activateSelection = function () {
  this.notifyFn({
    action: 'activate',
    index: this.optionsList.indexOf(this.selectedOption)
  });
}

//----------------------
//    select methods
//----------------------

ListBox.prototype.selectFirstOption = function () {
  this.setSelected(this.firstOption);
};

ListBox.prototype.selectLastOption = function () {
  this.setSelected(this.lastOption);
};

ListBox.prototype.selectPrevOption = function () {
  if (this.selectedOption === this.firstOption) return;

  let index = this.optionsList.indexOf(this.selectedOption);
  this.setSelected(this.optionsList[index - 1]);
};

ListBox.prototype.selectNextOption = function () {
  if (this.selectedOption === this.lastOption) return;

  let index = this.optionsList.indexOf(this.selectedOption);
  this.setSelected(this.optionsList[index + 1]);
};

ListBox.prototype.selectPrevPage = function () {
  if (this.selectedOption === this.firstOption) return;

  let index = this.optionsList.indexOf(this.selectedOption);
  let tgtIndex = index - this.increment;

  if (tgtIndex < 0) {
    this.selectFirstOption();
  }
  else {
    this.setSelected(this.optionsList[tgtIndex]);
  }
};

ListBox.prototype.selectNextPage = function () {
  if (this.selectedOption === this.lastOption) return;

  let index = this.optionsList.indexOf(this.selectedOption);
  let tgtIndex = index + this.increment;

  if (tgtIndex > this.optionsList.length - 1) {
    this.selectLastOption();
  }
  else {
    this.setSelected(this.optionsList[tgtIndex]);
  }
};
