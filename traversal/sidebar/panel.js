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

/*
*   Generic error handler
*/
function onError (error) {
  console.log(`Error: ${error}`);
}

/*
*   Update the variable in background script used for toggling sidebar
*/
function updateOpenStatus (isOpen) {
  function onGotPage (page) {
    page.sidebarIsOpen = isOpen;
    console.log(`open status: ${isOpen}`);
  }

  let gettingPage = browser.runtime.getBackgroundPage();
  gettingPage.then(onGotPage, onError);
}

window.addEventListener("load",   function (e) { updateOpenStatus(true) });
window.addEventListener("unload", function (e) { updateOpenStatus(false) });
