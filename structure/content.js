/*
*   content.js
*/
browser.runtime.sendMessage({
  url: window.location.href,
  title: document.title,
  infoList: getInfo()
});

/*
*   isVisible: Recursively check element properties from getComputedStyle
*   until document element is reached, to determine whether element or any
*   of its ancestors has properties set that affect its visibility.
*/
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

/*
*   getNodeContents: Recursively process element and text nodes by aggregating
*   their text values for an ARIA text equivalent calculation.
*/
function getNodeContents (node) {
  let contents = '';

  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      if (node.hasChildNodes()) {
        let children = node.childNodes,
            arr = [];

        for (let i = 0; i < children.length; i++) {
          let nc = getNodeContents(children[i]);
          if (nc.length) arr.push(nc);
        }

        contents = (arr.length) ? arr.join(' ') : '';
      }
      break;

    case Node.TEXT_NODE:
      contents = node.textContent.trim();
  }

  return contents;
}

/*
*   getElementContents: Construct the ARIA text alternative for element by
*   processing its element and text node descendants and then adding any CSS-
*   generated content if present.
*/
function getElementContents (element) {
  let result = '';

  if (element.hasChildNodes()) {
    let children = element.childNodes,
        arrayOfStrings = [];

    for (let i = 0; i < children.length; i++) {
      let contents = getNodeContents(children[i]);
      if (contents.length) arrayOfStrings.push(contents);
    }

    result = (arrayOfStrings.length) ? arrayOfStrings.join(' ') : '';
  }

  return result;
}

/*
*   getContentsOfChildNodes: Using predicate function for filtering element
*   nodes, collect text content from all child nodes of element.
*/
function getContentsOfChildNodes (element, predicate) {
  let arr = [], content;

  Array.prototype.forEach.call(element.childNodes, function (node) {
    switch (node.nodeType) {
      case (Node.ELEMENT_NODE):
        if (predicate(node)) {
          content = getElementContents(node);
          if (content.length) arr.push(content);
        }
        break;
      case (Node.TEXT_NODE):
        content = node.textContent.trim();
        if (content.length) arr.push(content);
        break;
    }
  });

  if (arr.length) return arr.join(' ');
  return '';
}

/*
*   isHeadingElement: Helper function
*/
function isHeadingElement (name) {
  let allHeadings = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  return (allHeadings.indexOf(name) >= 0);
}

/*
*   getInfo: Utilize TreeWalker API to traverse DOM using filter functions.
*/
function getInfo () {

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
      text: getContentsOfChildNodes(node, isVisible)
    }
    infoList.push(nodeInfo);
  }

  return infoList;
}
