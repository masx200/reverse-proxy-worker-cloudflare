/**
 * 需要拦截并重定向到本地的域名列表
 */
const REDIRECT_域名前缀 = [
  "https://release-assets.githubusercontent.com",
  "https://raw.githubusercontent.com",
];

/**
 * 判断给定的URL是否需要被拦截并重定向到本地
 * @param url 要检查的URL
 * @returns 如果需要拦截返回true，否则返回false
 */
function shouldInterceptRedirect(url: string): boolean {
  return REDIRECT_域名前缀.some((prefix) => url.startsWith(prefix));
}

/**
 * 将外部URL转换为本地代理URL
 * @param externalUrl 外部URL
 * @param token 认证token
 * @param requestUrl 当前请求URL，用于获取协议和主机信息
 * @returns 本地代理URL
 */
function convertToLocalUrl(
  externalUrl: string,
  token: string,
  requestUrl: string,
): string {
  const url = new URL(externalUrl);
  const currentUrl = new URL(requestUrl);

  // 使用当前请求的协议和主机信息
  const protocol = url.protocol.slice(0, -1);
  const host = url.hostname + (url.port ? `:${url.port}` : "");
  const path = url.pathname + url.search;

  return `${currentUrl.protocol}//${currentUrl.host}` +
    `/token/${token}/${protocol}/${host}${path}`;
}

export async function ReverseProxy(
  request: Request,
  url: URL,
  token?: string,
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
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
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
    const response = await fetch(getRequest, {});

    // 检查是否是重定向响应
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location && shouldInterceptRedirect(location) && token) {
        const localUrl = convertToLocalUrl(location, token, request.url);
        console.log(
          JSON.stringify(
            {
              message: "重定向拦截",
              originalLocation: location,
              newLocation: localUrl,
              status: response.status,
            },
            null,
            4,
          ),
        );

        // 创建新的响应，将location指向本地
        const newHeaders = new Headers(response.headers);
        newHeaders.set("location", localUrl);

        return new Response(response.body, {
          headers: newHeaders,
          status: response.status,
        });
      }
    }

    return response;
  } catch (error) {
    console.error(error);
    return new Response("bad gateway" + "\n" + String(error), {
      status: 502,
    });
  }
}
