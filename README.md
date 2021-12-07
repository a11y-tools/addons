## Firefox Add-ons: Prototype Descriptions

### 1. sidebar

This is an initial prototype that demonstrates how to populate the sidebar
with content when it loads, and how to refresh the content as needed by
handling the `tabs.onActivated` and `tabs.onUpdated` events.

It also illustrates how the communication works between the `panel.js` script
that keeps track of whether the sidebar is open or closed using a boolean
variable in the background script named `sidebarIsOpen`, and the
`browserAction.onClicked` event listener in `background.js` that utilizes that
variable to implement the sidebar toggling behavior.

It includes the following features:

* Browser action button for the extension toggles the sidebar open or closed.
* The sidebar displays the URL of the active tab in its content area by using
  the `tabs` API.
* The URL is updated when the active tab changes or a new page is loaded.
* It does not utilize a content script, so the messaging is very basic.

Notes:

* Based on the Mozilla `webextensions-examples` repo `annotate-page` example:
  * Removed event handlers that add and remove the `contenteditable` attribute.
  * Removed functionality that stores annotations.

### 2. content-script

This prototype builds on the feature set of the `sidebar` prototype by adding
the following new features:

* Utilizes a content script to get information from the page loaded into the
  active tab (currently, just the page title and URL).
* The message passing within the extension now does the following:
  * When the sidebar content needs to be updated, the `getContent` function
    is called, which runs the content script.
  * It, in turn, sends a message, which `panel.js` listens for.
  * When that message is received, it contains the content needed for the call
    to the `updateSidebar` function.
* The prototype uses the `browser.i18n` API to store and retrieve UI labels
  and messages from locale-specific files.

### 3. traversal

This prototype builds on the feature set of the `content-script` prototype by
adding the following new features:

* The content script traverses the DOM of the page loaded into the active tab
  and saves filtered information (currently only heading elements) into the
  data structure that it sends as a message to the background script.
* The content script uses the DOM `TreeWalker` API.
* The message passing is now centralized, and occurs only between the content
  and background scripts. When the background script receives the message, it
  stores its data in the `contentInfo` variable.
* The function `updateContent` in `panel.js` calls the content script, and
  waits until the Promise it receives acknowledges that the script has executed
  before it accesses the data stored in the background script's `contentInfo`
  variable.
* The event listeners for tabs.onUpdated and tabs.onActivated are removed when
  the sidebar is closed.
* The tabs.onUpdated event listener now has a filter that specifies that only
  updates to the `status` property should fire events.
* A special handler for tabs.onUpdated events, named `handleTabUpdate`, was
  created that examines the `status` property: When its value is "complete" it
  calls the `updateContent` function; otherwise it displays the `tabIsLoading`
  message using a timeout to avoid jerkiness with sidebar content updates.
* Missing from previous prototypes was an `onFocusChanged` handler, which has
  now been added in `panel.js`. This handles the situation when a link is
  opened in a new window. It is interesting to note that the sidebar will
  always display the same information when there is more than one window, i.e.
  the information for the active tab, even if it's in a different window.

### 4. headings

The `headings-*` prototypes build on the feature set of the `traversal`
prototype.

* The sidebar now displays headings information for the active tab in a box
  labeled `Headings`, using CSS grid layout features. Each heading item has
  a prefix label indicating its level, and is indented horizontally based on
  its level.
* The items in the `Headings` box are scrollable, and each item is selectable.
* There are two buttons below the `Headings` box, one labeled `Highlight
  Selected` and the other `Remove Highlighting`, each with its own event
  handler.
* The handler functions for the highlight buttons use the `browser.find` API,
  which only partially works in production Firefox, and is throwing errors in
  FDE when `browser.find.highlightResults` is called. In the former case, the
  call does not result in scrolling to the highlighted results.
* Messaging now takes place directly between `content.js` and `panel.js`, so
  the `contentInfo` variable in `background.js` was removed.
* When the `panel.js` function `updateContent` is called, it executes the
  content script. Its `onExecuted` callback only logs caller information, as
  the `panel.js` script now waits for the message from `content.js` before
  calling the `updateSidebar` function with the heading information contained
  in the message.
* The content script functions have been rewritten: The `getInfo` function now
  includes a nested function named `traverseDom` that uses the `DOM` API
  directly, replacing the use of the `TreeWalker` API. Another new function,
  `getDescendantTextContent`, recursively handles the collection of text
  content for each heading.

### 5. structure

The `structure-*` prototypes build on the feature set created in the series of
`headings-*` prototypes.

* structure-1

  * Adds the `listbox.js` script and its companion `listbox.css` to encapsulate
    the functionality of the headings list.

* structure-2

  * Refactored to utilize ES6 `modules` wherever possible.
  * The `listbox.js` script was converted to a JavaScript class that is the
    default export of the module.
  * Reworked DOM traversal to include `custom elements` (by examining the
    `shadow root` children) and any `slot` elements they may contain.
  * The `content.js` script was split into two scripts with the addition of
    `traversal.js`.
  * The `storage.js` script was added as a facility for future versions if and
    when extension options / preferences are needed.

* structure-3

  * Reworked the messaging scheme to use a persistent port for communication
    between the `panel.js` and `content.js` scripts.
  * Although not yet displayed in the sidebar, includes collecting information
    on landmarks as well as headings.
  * Refactored the `traversal.js` script such that the DOM traversal function
    is greatly simplified. It now relies on a new function named `saveInfo`.
  * After adding the function `testForLandmark`, the `traversal.js` was split
    into two scripts, moving utility code into `utils.js`
