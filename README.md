## Firefox Add-ons: Prototype Descriptions

### 1. sidebar

This is an initial prototype that demonstrates how to populate the sidebar
with content when it loads, and how to refresh the content as needed by
handling the tabs.onActivated and tabs.onUpdated events.

It also illustrates how the communication works between the `panel.js` script
that keeps track of whether the sidebar is open or closed using a boolean
variable in the background script named `sidebarIsOpen`, and the
`browserAction.onClicked` event listener in `background.js` that utilizes that
variable to implement the toggling behavior.

It has the following features:

* Browser action button for the extension toggles the sidebar open or closed.
* The sidebar displays the URL of the active tab in its content area.
* The URL is updated when the active tab changes or a new page is loaded.
* It does not utilize a content script, so the messaging is very basic.

Notes:

* Based on the Mozilla `webextensions-examples` repo `annotate-page` example:
  * Removed event handlers that add and remove the contenteditable attribute.
  * Removed functionality that stores annotations.

### 2. content-script

This prototype builds on the feature set of the `sidebar` prototype by adding
the following new features:

* Utilizes a content script to get information from the page loaded into the
  active tab (currently, just the page title and URL).
* The message passing within the extension now does the following:
  * When the sidebar content needed to be updated, the `getContent` function
    is called, which runs the content script. It, in turn, sends a message,
    which `panel.js` listens for. When that message is received, it contains
    the content needed for the call to the `updateSidebar` function.
* Uses the `browser.i18n` API to store all UI labels and messages in locale-
  specific files.
