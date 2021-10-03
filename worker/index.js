const { parse } = require('node-html-parser');
const uwuifier = require('uwuify');
const uwuify = new uwuifier();

const listOfElements = [
  // This array shoud contain all elements that's innerHTML should be UWU'd
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'A',
  'UL',
  'LI',
  'EM',
  'B',
  'I',
  'STRONG',
  'SPAN'
]

const rootUrl = 'http://localhost:8787/uwuify?url=';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * @param {HTMLElement} node
 */
function deepText(node) {
  let A = [];
  if (!node) return [];
  node.childNodes.forEach(childNode => {
    if (childNode.nodeType === 3) {
      if (!listOfElements.includes(node.tagName)) return;
      if (childNode.textContent) {
        childNode.textContent = uwuify.uwuify(childNode.textContent);
      }
      A.push(childNode);
    } else {
      A = A.concat(deepText(childNode));
    }
  })
  return A;
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const { searchParams, pathname } = new URL(request.url)
  let targetUrl = searchParams.get('url');
  if ((pathname === '/uwuify' || pathname === '/uwuify/') && targetUrl) {
    try {
      const url = new URL(targetUrl);
      const response = await fetch(url);
      const html = (await (await response).text());
      const root = parse(html);
      deepText(root);
      /*listOfElements.forEach(e => {
        console.log("Parsing " + se);
        root.querySelectorAll(e).forEach(element => {
          if (element.childNodes.length > 1) {
            return;
          }
          element.innerHTML = uwuify.uwuify(element.innerHTML);
        })
      })*/

      root.querySelectorAll('a').forEach((link) => {
        try {
          if (link.hasAttribute('href')) new URL(link.getAttribute('href'))
        } catch (e) {
          link.setAttribute('href', new URL(link.getAttribute('href'), targetUrl).toString())
        }
        if (link.hasAttribute('href')) link.setAttribute('href', `${rootUrl}${link.getAttribute('href')}`);
      })

      // Fix all links and scripts
      root.querySelectorAll('link').forEach(link => {
        try {
          if (link.hasAttribute('href')) new URL(link.getAttribute('href'))
        } catch (e) {
          link.setAttribute('href', new URL(link.getAttribute('href'), targetUrl).toString())
        }
      })

      root.querySelectorAll('script').forEach(link => {
        try {
          if (link.hasAttribute('src')) new URL(link.getAttribute('src'))
        } catch (e) {
          link.setAttribute('src', new URL(link.getAttribute('src'), targetUrl).toString())
        }
      })

      return new Response(root.toString(), {
        headers: { 'content-type': 'text/html' },
      })
    } catch(e) {
      return new Response('Error: ' + e.message, {
        headers: { 'content-type': 'text/plain' },
      })
    }
  }
  return new Response('GET /uwuify?url=<url>', {
    headers: { 'content-type': 'text/plain' },
  })
}
