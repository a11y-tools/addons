## Firefox Add-ons: Next Generation Accessibility Tools

### structure

Based on the sidebar prototype, the purpose of this add-on is to display the
following structural elements in the current page:

* Landmarks
* Headings

Additionally, the page title is also displayed.

Based on the information that this add-on displays, a content script is needed
and a way for it to communicate with the sidebar.

### sidebar

This is an initial prototype that demonstrates how to refresh sidebar content
by handling the tabs.onActivated and tabs.onUpdated events.

* Based on the Mozilla `webextensions-examples` repo `annotate-page` example
* Removed the event handlers that add and remove the contenteditable attribute
* Removed functionality that stores annotations

