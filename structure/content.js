/*
*   content.js
*/
browser.runtime.sendMessage({
  url: window.location.href,
  title: document.title,
  infoList: getInfo()
});

function getInfo () {
  function isVisible (element) {

    function isVisibleRec (el) {
      if (el.nodeType === Node.DOCUMENT_NODE) return true;

      let computedStyle = window.getComputedStyle(el, null);
      let display = computedStyle.getPropertyValue('display');
      let visibility = computedStyle.getPropertyValue('visibility');
      let hidden = el.getAttribute('hidden');
      let ariaHidden = el.getAttribute('aria-hidden');

      if ((display === 'none') || (visibility === 'hidden') ||
          (hidden !== null) || (ariaHidden === 'true')) {
        return false;
      }
      return isVisibleRec(el.parentNode);
    }

    return isVisibleRec(element);
  }

  function isHeadingElement (name) {
    let allHeadings = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    return (allHeadings.indexOf(name) >= 0);
  }

  let treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    { acceptNode: function (node) { return isHeadingElement(node.tagName) && isVisible(node) } },
    false
  );

  let infoList = [];

  while (treeWalker.nextNode()) {
    let node = treeWalker.currentNode;
    let nodeInfo = {
      name: node.tagName,
      text: node.textContent
    }
    infoList.push(nodeInfo);
  }

  return infoList;
}
