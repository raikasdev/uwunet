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

const rootUrl = 'https://uwunet.raikas.workers.dev/uwuify?url=';

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
      if (UWUNET_KV.get(url.toString())) {
        const cache = UWUNET_KV.get(url.toString(), { type: 'json' });
        if (Date.now() < (cache.timestamp + 600000)) {
          return new Response(cache.html, {
            headers: { 'content-type': 'text/html' },
          })
          return;
        }
      }
      const response = await fetch(url);
      const html = (await (await response).text());
      const root = parse(html);
      deepText(root);

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

      UWUNET_KV.put(url.toString(), JSON.stringify({
        timestamp: Date.now(),
        html: root.toString(),
      }))
      return new Response(root.toString(), {
        headers: { 'content-type': 'text/html' },
      })
    } catch(e) {
      return new Response('Error: ' + e.message, {
        headers: { 'content-type': 'text/plain' },
      })
    }
  }
  return new Response(`
  <!DOCTYPE html>
  <html>
      <head>
          <title>UwUNet</title>
      </head>
      <body>
          <form action="/uwuify">
              <h1>UwUNet</h1>
              <p>View (almost) every website UWUFIED!</p>

              <p>What website would you like to see?</p>
              <input type="url" name="url" placeholder="https://cloudflare.com"><br>
              <input type="submit" value="See it uwufied!">
          </form>
          <h3>Websites that work on some level</h3>
          <ul>
            <li><a href="/uwuify?url=https://cloudflare.com">Cloudflare.com</a></li>
            <li><a href="/uwuify?url=https://en.wikipedia.org/wiki/Cloudflare">Wikipedia (Cloudflare)</a></li>
            <li><a href="/uwuify?url=https://en.wikipedia.org/">Wikipedia (Home page)</a></li>
            <li><a href="/uwuify?url=https://motherfuckingwebsite.com/">Motherfucking website</a></li>
            <li><a href="/uwuify?url=https://aws.com/">AWS</a></li>
          </ul>
          <p>NoCSS website. I ain't a good frontend developer :).</p>
      </body>
  </html>
`, {
    headers: { 'content-type': 'text/html' },
  })
}
