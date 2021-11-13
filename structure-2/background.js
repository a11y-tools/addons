/*
*   background.js
*/

import { getOptions } from './storage.js';

function toggleSidebar () {
  getOptions().then(options => {
    if (options.isSidebarOpen) {
      browser.sidebarAction.close();
    }
    else {
      browser.sidebarAction.open();
    }
  });
}

/*
*   Toggle the sidebar when browserAction button is clicked
*/
browser.browserAction.onClicked.addListener(function (e) {
  toggleSidebar();
});
