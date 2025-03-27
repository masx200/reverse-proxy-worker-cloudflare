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
    return await fetch(getRequest, {});
  } catch (error) {
    console.error(error);
    return new Response("bad gateway" + "\n" + String(error), {
      status: 502,
    });
  }
}
