import { Env } from "./index.ts";
import { ReverseProxy } from "./ReverseProxy.ts";

export async function fetchMiddleWare(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  next: () => Promise<Response>,
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
  if (!token) {
    return next();
  }
  if (nextUrl.pathname.startsWith("/token/" + token + "/http/")) {
    let url = new URL(
      "http://" + nextUrl.pathname.slice(6 + ("/token/" + token).length),
    );
    url.search = nextUrl.search;
    /* 循环处理多重前缀 */
    while (url.pathname.startsWith("/token/" + token + "/http/")) {
      url = new URL(
        "http://" + url.pathname.slice(6 + ("/token/" + token).length),
      );
      url.search = nextUrl.search;
    }
    // requestHeaders.set("host", url.hostname);
    url.search = new URL(request.url).search;
    return await ReverseProxy(request, url, token);
  }
  if (nextUrl.pathname.startsWith("/token/" + token + "/https/")) {
    let url = new URL(
      "https://" + nextUrl.pathname.slice(6 + 1 + ("/token/" + token).length),
    );
    /* 添加search */
    url.search = nextUrl.search;
    /* 循环处理多重前缀 */
    while (url.pathname.startsWith("/token/" + token + "/https/")) {
      url = new URL(
        "https://" + url.pathname.slice(6 + 1 + ("/token/" + token).length),
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
    return await ReverseProxy(request, url, token);
  }
  return next();
}
