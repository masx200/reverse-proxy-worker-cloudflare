export interface Env {
  DOH_ENDPOINT: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/dns-query") {
      return new Response("not found", { status: 404 });
    }
    if (request.method === "POST") {
      return handleRequest(request, env);
    }
    return fetch(request);
  },
};
/**
 * 处理DNS请求的函数。
 * @param request 原始的请求对象，需要是一个POST请求，其中包含未编码的DNS查询。
 * @param env 包含环境配置的对象，例如DOH_ENDPOINT（DNS over HTTPS 终端）的URL。
 * @returns 返回一个Promise，该Promise解析为从原始服务器获取的响应。
 */
async function handleRequest(request: Request, env: Env) {
  // Base64 encode request body.
  const body = await request.arrayBuffer();
  const encodedBody = base64Encode(body);

  // Create a request URL with encoded body as query parameter.
  const url = new URL(`${env.DOH_ENDPOINT}`);
  url.searchParams.append("dns", encodedBody);

  if (!url.href.startsWith("https://")) {
    throw Error(`The DOH_ENDPOINT must be a HTTPS URL.`);
  }

  // Create a GET request from the original POST request.
  const getRequest = new Request(url.href, {
    method: "GET",
    body: null,
  });

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
