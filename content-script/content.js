/*
*   content.js
*/
browser.runtime.sendMessage({
  id: 'contentData',
  href: window.location.href,
  title: document.title
});
