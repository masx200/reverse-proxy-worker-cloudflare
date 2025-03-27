export interface CloudflareMiddleWare<Env> {
  (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    next: () => Promise<Response>,
  ): Promise<Response>;
}
export async function bodyToBuffer(
  body?: BodyInit | null,
): Promise<Uint8Array> {
  return new Uint8Array(await new Response(body).arrayBuffer());
}
