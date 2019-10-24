/*
*   content.js
*/
browser.runtime.sendMessage({
  infoList: getInfo(),
  title: document.title,
  url: window.location.href
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
*   isHeading: Helper function
*/
function isHeading (element) {
  let allHeadings = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  return (allHeadings.indexOf(element.tagName) >= 0);
}

/*
*   getInfo: Use the traverseDom function to recursively find each visible
*   heading element in the document, collect its text content from visible
*   child elements and store all relevant info in the returned infoList.
*/
function getInfo () {
  let infoList = [];

  function traverseDom (startElement) {
    // Process the child elements
    for (let i = 0; i < startElement.children.length; i++) {
      let element = startElement.children[i];
      // Save information if element meets criteria
      if (isHeading(element) && isVisible(element)) {
        let headingInfo = {
          name: element.tagName,
          text: getContentsOfChildNodes(element, isVisible)
        }
        infoList.push(headingInfo);
      }
      else {
        traverseDom(element);
      }
    }
  }

  // Start with body element and traverse entire DOM
  traverseDom(document.body);
  return infoList;
}
