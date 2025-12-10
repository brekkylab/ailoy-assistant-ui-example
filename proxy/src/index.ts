/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
const DUCKDUCKGO_URL = "https://html.duckduckgo.com/html";
const MAX_REDIRECTS = 10;
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Vivaldi/6.4.3160.42",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0",
];

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: getCorsHeaders(),
      });
    }

    if (pathname === "/web-search-duckduckgo" && request.method === "POST") {
      return handleDuckDuckGoRequest(request);
    }

    if (pathname === "/web-fetch" && request.method === "GET") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        return new Response(
          JSON.stringify({ error: "Missing 'url' query parameter" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...getCorsHeaders(),
            },
          },
        );
      }
      return await fetchWithRedirects(targetUrl, 0);
    }

    // Reject other methods
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...getCorsHeaders() },
    });
  },
};

async function handleDuckDuckGoRequest(request: Request): Promise<Response> {
  try {
    const body = await request.arrayBuffer();

    const headers = new Headers({
      "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      "Content-Type": "application/x-www-form-urlencoded",
    });

    const proxyReq = new Request(DUCKDUCKGO_URL, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const response = await fetch(proxyReq);
    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (
        !["transfer-encoding", "connection", "content-encoding"].includes(
          key.toLowerCase(),
        )
      ) {
        responseHeaders.set(key, value);
      }
    }

    // Add CORS headers
    for (const [key, value] of Object.entries(getCorsHeaders())) {
      responseHeaders.set(key, value);
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(),
      },
    });
  }
}

async function fetchWithRedirects(
  targetUrl: string,
  redirectCount: number,
): Promise<Response> {
  try {
    if (redirectCount > MAX_REDIRECTS) {
      return new Response(JSON.stringify({ error: "Too many redirects" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...getCorsHeaders(),
        },
      });
    }

    const headers = new Headers({
      "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    });

    const response = await fetch(new Request(targetUrl, { headers }));

    // Handle redirects
    const status = response.status;
    if (status >= 300 && status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const absoluteUrl = new URL(location, targetUrl).toString();
        return await fetchWithRedirects(absoluteUrl, redirectCount + 1);
      }
    }

    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (
        !["transfer-encoding", "connection", "content-encoding"].includes(
          key.toLowerCase(),
        )
      ) {
        responseHeaders.set(key, value);
      }
    }

    for (const [key, value] of Object.entries(getCorsHeaders())) {
      responseHeaders.set(key, value);
    }

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(),
      },
    });
  }
}

function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "https://webui.ailoy.co",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
