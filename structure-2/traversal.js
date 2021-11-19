/*
*   Helper functions
*/

function isCustomElement (element) {
  return (element.tagName.indexOf('-') > 0);
}

function isHeading (element) {
  return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName);
}

function isSlot (element) {
  return (element.tagName === 'SLOT');
}

function getChildren (element) {
  // slot element
  if (isSlot(element)) {
    return element.assignedElements();
  }
  // custom element
  if (isCustomElement(element)) {
    if (element.shadowRoot !== null) {
      return Array.from(element.shadowRoot.children);
    }
    else {
      return [];
    }
  }
  // default
  return Array.from(element.children);
}

/*
*   getHeadingInfo: Recursively find each visible heading element in the
*   document, collect its text content from visible child elements and store
*   all relevant info in the returned infoList.
*/
function getHeadingInfo () {
  let infoList = [];

  function traverseDom (startElement) {
    // Get the child elements
    const children = getChildren(startElement);

    // Process the child elements
    children.forEach(element => {
      console.log(`element: ${element} ${element.tagName}`);
      // Save information if element meets criteria
      if (isHeading(element) && isVisible(element)) {
        let results = [];
        getDescendantTextContent(element, isVisible, results);
        let headingInfo = {
          name: element.tagName,
          text: results.length ? results.join(' ') : ''
        }
        infoList.push(headingInfo);
      }
      else {
        traverseDom(element);
      }
    })
  }

  // Start with body element and traverse entire DOM
  traverseDom(document.body);
  return infoList;
}

/*
*   getDescendantTextContent: Collect the textContent values of child text
*   nodes, and descendant text nodes of child elements that meet the predicate
*   condition, by storing the values in the results array.
*/
function getDescendantTextContent (node, predicate, results) {
  // Process the child nodes
  for (let i = 0; i < node.childNodes.length; i++) {
    let child = node.childNodes[i];

    switch (child.nodeType) {
      case (Node.ELEMENT_NODE):
        if (predicate(child)) {
          getDescendantTextContent(child, predicate, results);
        }
        break;
      case (Node.TEXT_NODE):
        let content = child.textContent.trim();
        if (content.length) { results.push(content); }
        break;
    }
  }
}

/*
*   isVisible: Recursively check element properties from getComputedStyle
*   until document element is reached, to determine whether element or any
*   of its ancestors has properties set that affect its visibility.
*/
function isVisible (element) {
  if (element.nodeType === Node.DOCUMENT_NODE) return true;

  if (element.nodeType === Node.ELEMENT_NODE) {
    let computedStyle = window.getComputedStyle(element, null);
    let display    = computedStyle.getPropertyValue('display');
    let visibility = computedStyle.getPropertyValue('visibility');
    let hidden     = element.getAttribute('hidden');
    let ariaHidden = element.getAttribute('aria-hidden');

    if ((display === 'none') || (visibility === 'hidden') ||
        (hidden !== null) || (ariaHidden === 'true')) {
      return false;
    }
  }
  // If element's parent is a shadowRoot, use the parent's host element
  const parentNode = (element.parentNode instanceof DocumentFragment)
    ? element.parentNode.host : element.parentNode;
  return isVisible(parentNode);
}
