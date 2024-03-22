import { Strict_Transport_Security } from "./CloudflareMiddleWare";

export interface Env {
  DOH_ENDPOINT: string;
}
async function fetchMiddleWare(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  console.log(
    JSON.stringify(
      {
        request: {
          method: request.method,
          url: request.url,
          Headers: Object.fromEntries(request.headers),
        },
      },
      null,
      2,
    ),
  );
  const url = new URL(request.url);
  if (url.pathname !== "/dns-query") {
    return new Response("not found", { status: 404 });
  }
  if (request.method === "POST") {
    return handleRequest(request, env);
  }
  if (request.method !== "GET") {
    return new Response("method not allowed", { status: 405 });
  }
  return handleGet(env, url, request);
}
export default {
  /**
   * 一个用于处理网络请求的函数。
   *
   * @param request - 表示客户端发起的请求对象。
   * @param env - 包含环境特定信息的对象。
   * @param ctx - 执行上下文，提供额外的请求处理功能。
   * @returns 返回一个承诺（Promise），该承诺解析为一个响应对象（Response）。
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return Strict_Transport_Security<Env>(
      request,
      env,
      ctx,
      async () => await fetchMiddleWare(request, env, ctx),
    );
  },
}; /**
 * 处理GET请求的函数。
 * @param env 包含环境配置的对象，例如DOH_ENDPOINT（DNS over HTTPS 终端点）等。
 * @param url 用户请求的URL对象。
 * @returns 返回一个Promise，该Promise解析为从原始服务器获取的响应。
 */

async function handleGet(env: Env, url: URL, request: Request) {
  const upurl = new URL(`${env.DOH_ENDPOINT}`);
  upurl.search = url.search;
  const headers = new Headers(request.headers);
  headers.append(
    "Forwarded",
    `proto=${new URL(url).protocol.slice(0, -1)};host=${
      new URL(url).hostname
    };by=${url.host};for=${request.headers.get("cf-connecting-ip")}`,
  );
  const getRequest = new Request(upurl.href, {
    method: "GET",
    body: null,
    headers: headers,
  });
  console.log(
    JSON.stringify(
      {
        request: {
          method: getRequest.method,
          url: getRequest.url,
          Headers: Object.fromEntries(getRequest.headers),
        },
      },
      null,
      2,
    ),
  );
  // Fetch response from origin server.
  return await fetch(getRequest, {
    cf: {
      cacheEverything: true,
    },
  });
}

/**
 * 处理DNS请求的函数。
 * @param request 原始的请求对象，需要是一个POST请求，其中包含未编码的DNS查询。
 * @param env 包含环境配置的对象，例如DOH_ENDPOINT（DNS over HTTPS 终端）的URL。
 * @returns 返回一个Promise，该Promise解析为从原始服务器获取的响应。
 */
async function handleRequest(request: Request, env: Env) {
  // Base64 encode request body.
  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return new Response("bad request", { status: 400 });
  }
  const encodedBody = base64Encode(body);

  // Create a request URL with encoded body as query parameter.
  const url = new URL(`${env.DOH_ENDPOINT}`);
  url.searchParams.append("dns", encodedBody);

  if (!url.href.startsWith("https://")) {
    throw Error(`The DOH_ENDPOINT must be a HTTPS URL.`);
  }
  const headers = new Headers(request.headers);
  headers.append(
    "Forwarded",
    `proto=${new URL(url).protocol.slice(0, -1)};host=${
      new URL(url).hostname
    };by=${url.host};for=${request.headers.get("cf-connecting-ip")}`,
  );
  // Create a GET request from the original POST request.
  const getRequest = new Request(url.href, {
    method: "GET",
    body: null,
    headers: headers,
  });
  console.log(
    JSON.stringify(
      {
        request: {
          method: getRequest.method,
          url: getRequest.url,
          Headers: Object.fromEntries(getRequest.headers),
        },
      },
      null,
      2,
    ),
  );
  // Fetch response from origin server.
  return await fetch(getRequest, {
    cf: {
      cacheEverything: true,
    },
  });
}
/**
 * 将 ArrayBuffer 对象编码为 Base64 字符串。
 * @param byteArray {ArrayBuffer} - 需要进行 Base64 编码的 ArrayBuffer 对象。
 * @returns {string} 编码后的 Base64 字符串。
 */
function base64Encode(byteArray: ArrayBuffer): string {
  const buffer = new Uint8Array(byteArray);
  const binaryString = buffer.reduce(
    (str, byte) => str + String.fromCharCode(byte),
    "",
  );
  const encoded = btoa(binaryString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return encoded;
}
