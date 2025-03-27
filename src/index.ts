import { Strict_Transport_Security } from './Strict_Transport_Security';
import { fetchMiddleWare } from './fetchMiddleWare';
//@ts-ignore
export interface Env {
  token: string;
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
};
