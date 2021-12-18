/*
*   panel.js
*/

import { TabSet } from './tabset.js';
import TabEvents from './tabevents.js';

var tabSet = document.querySelector('tab-set');
var tabEvents;
var myWindowId;

/*
*   Update the sidebar's content:
*   1) Get the active tab in this sidebar's window
*   2) Display the active tab's URL
*/
function updateContent() {
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
      document.getElementById('content').textContent = tabs[0].url;
    });
}

/*
*   Update content when a new tab becomes active
*/
browser.tabs.onActivated.addListener(updateContent);

/*
*   Update content when a new page is loaded into a tab
*/
browser.tabs.onUpdated.addListener(updateContent);

/*
*   When the sidebar loads, get the ID of its window, and update its content
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});

tabEvents = new TabEvents(tabSet.tabs, tabSet.panels);
tabEvents.logArrays();
