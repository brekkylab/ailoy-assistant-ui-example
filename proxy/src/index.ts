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
const PROXY_TARGET = 'https://html.duckduckgo.com/html';

export default {
	async fetch(request: Request): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCorsHeaders(),
			});
		}

		// Handle POST requests
		if (request.method === 'POST') {
			return handleRequest(request);
		}

		// Reject other methods
		return new Response(JSON.stringify({ error: 'Method not allowed' }), {
			status: 405,
			headers: { 'Content-Type': 'application/json' },
		});
	},
};

async function handleRequest(request: Request): Promise<Response> {
	try {
		const body = await request.arrayBuffer();

		const headers = new Headers({
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			'Content-Type': 'application/x-www-form-urlencoded',
		});

		const proxyReq = new Request(PROXY_TARGET, {
			method: 'POST',
			headers: headers,
			body: body,
		});

		const response = await fetch(proxyReq);
		const responseBody = await response.arrayBuffer();

		const responseHeaders = new Headers();
		for (const [key, value] of response.headers.entries()) {
			if (!['transfer-encoding', 'connection', 'content-encoding'].includes(key.toLowerCase())) {
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
				'Content-Type': 'application/json',
				...getCorsHeaders(),
			},
		});
	}
}

function getCorsHeaders(): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': 'https://web-example.ailoy.co',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	};
}
