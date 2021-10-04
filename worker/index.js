const uwuifier = require('uwuify');
const uwuify = new uwuifier();

const rootUrl = 'https://uwunet.raikas.workers.dev/uwuify?url=';

class TextHandler {
  text(text) {
    if (!text.text || text.length == 0) return;
    text.replace(uwuify.uwuify(text.text))
  }
}

class HyperlinkHandler {
  constructor(root) {
    this.root = root;
  }

  element(element) {
    try {
      if (element.hasAttribute("href")) {
        new URL(element.getAttribute("href")); // If this doesn't throw, it's an global link
      }
    } catch (e) {
      element.setAttribute('href', `${rootUrl}${new URL(element.getAttribute('href'), this.root).toString()}`);
    }
  }
}

class LinkHandler {
  constructor(root) {
    this.root = root;
  }

  element(element) {
    try {
      if (element.hasAttribute("href")) {
        new URL(element.getAttribute("href")); // If this doesn't throw, it's an global link
      }
    } catch (e) {
      element.setAttribute('href', new URL(element.getAttribute('href'), this.root).toString());
    }
  }
}
class ScriptHandler {
  constructor(root) {
    this.root = root;
  }

  element(element) {
    try {
      if (element.hasAttribute("src")) {
        new URL(element.getAttribute("src")); // If this doesn't throw, it's an global link
      }
    } catch (e) {
      element.setAttribute('src', new URL(element.getAttribute('src'), this.root).toString());
    }
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

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
        if ((Date.now() - cache.timestamp) < 600000) {
          return new Response(cache.html, {
            headers: { 'content-type': 'text/html' },
          })
          return;
        }
      }
      const response = await fetch(url);
      const newResponse = new HTMLRewriter()
      .on("p", new TextHandler())
      .on("h1", new TextHandler())
      .on("h2", new TextHandler())
      .on("h3", new TextHandler())
      .on("h4", new TextHandler())
      .on("h5", new TextHandler())
      .on("h6", new TextHandler())
      .on("a", new TextHandler())
      .on("ul", new TextHandler())
      .on("li", new TextHandler())
      .on("em", new TextHandler())
      .on("strong", new TextHandler())
      .on("i", new TextHandler())
      .on("b", new TextHandler())
      .on("span", new TextHandler())
      .on("title", new TextHandler())
      .on("script", new ScriptHandler(url.toString()))
      .on("a", new HyperlinkHandler(url.toString()))
      .on("link", new LinkHandler(url.toString()))
      .transform(response)

      const html = await newResponse.text();
      UWUNET_KV.put(url.toString(), JSON.stringify({
        timestamp: Date.now(),
        html: html,
      }))
      return new Response(html, {
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
            <li><a href="/uwuify?url=https://uwunet.raikas.workers.dev/cloudflare">Youtube</a></li>
          </ul>
          <p>How does it work?</p>
          <ul>
            <li>User sends an request with url</li>
            <li>If it is cached in KV (and not older than 10 minutes) send the cached one</li>
            <li>Else, fetch the website</li>
            <li>Use Cloudflare HTMLRewriter to replace all text, links, script src and link href's and title</li>
            <li>Save to KV for later use</li>
            <li>UwU for the user</li>
          </ul>
          <p>NoCSS website. I ain't a good frontend developer :).</p>
      </body>
  </html>
`, {
    headers: { 'content-type': 'text/html' },
  })
}
