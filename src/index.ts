import { Strict_Transport_Security } from "./CloudflareMiddleWare";
//@ts-ignore
import welcome from "./welcome.html";
export interface Env {
  token: string;
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

  const nextUrl = new URL(request.url);
  const token = env.token;
  if (nextUrl.pathname.startsWith("/token/" + token + "/http/")) {
    let url = new URL(
      "http://" +
        nextUrl.pathname.slice(6 + ("/token/" + token).length),
    );
    url.search = nextUrl.search;
    /* 循环处理多重前缀 */
    while (url.pathname.startsWith("/token/" + token + "/http/")) {
      url = new URL(
        "http://" +
          url.pathname.slice(6 + ("/token/" + token).length),
      );
      url.search = nextUrl.search;
    }
    // requestHeaders.set("host", url.hostname);
    url.search = new URL(request.url).search;
    return await ReverseProxy(request, url);
  }
  if (nextUrl.pathname.startsWith("/token/" + token + "/https/")) {
    let url = new URL(
      "https://" +
        nextUrl.pathname.slice(
          6 + 1 + ("/token/" + token).length,
        ),
    );
    /* 添加search */
    url.search = nextUrl.search;
    /* 循环处理多重前缀 */
    while (url.pathname.startsWith("/token/" + token + "/https/")) {
      url = new URL(
        "https://" +
          url.pathname.slice(
            6 + 1 + ("/token/" + token).length,
          ),
      );
      /* 添加search */
      url.search = nextUrl.search;
    }
    console.log({ url: url.href, method: request.method });

    // requestHeaders.set("host", url.hostname);

    // url.protocol = "https";
    // url.hostname = hostname;
    // url.port = String(443);
    //   url.pathname = url.pathname; //.replace(/^\//, '');

    // return NextResponse.rewrite(url, {
    //   headers: requestHeaders,
    // });
    return await ReverseProxy(request, url);
  }
  return new Response(welcome, {
    headers: {
      "content-type": "text/html",
    },
  });
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

export async function ReverseProxy(
  request: Request,
  url: URL,
): Promise<Response> {
  try {
    const upurl = new URL(url);

    const headers = new Headers(request.headers);
    headers.append(
      "Forwarded",
      `proto=${new URL(request.url).protocol.slice(0, -1)};host=${
        new URL(request.url).hostname
      };by=${url.host};for=${request.headers.get("cf-connecting-ip")}`,
    );
    const getRequest = new Request(upurl.href, {
      method: request.method,
      body: request.body,
      headers: headers,
      redirect: request.headers.get("x-proxy-redirect") ?? "manual",
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
    return await fetch(getRequest, {});
  } catch (error) {
    console.error(error);
    return new Response("bad gateway" + "\n" + String(error), {
      status: 502,
    });
  }
}
