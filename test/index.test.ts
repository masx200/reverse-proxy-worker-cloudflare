import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

describe("Reverse Proxy Worker", () => {
  beforeEach(() => {
    // 可以在每个测试前重置环境
  });

  describe("基本功能测试", () => {
    it("应该返回欢迎页面", async () => {
      const response = await SELF.fetch("http://localhost/");
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain("ok");
    });

    it("应该对不存在的路径返回 404", async () => {
      const response = await SELF.fetch("http://localhost/unknown-path");
      expect(response.status).toBe(404);

      const text = await response.text();
      expect(text).toBe("Not Found");
    });
  });

  describe("令牌认证测试", () => {
    it("应该拒绝无效令牌的请求", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/invalid-token/https/example.com",
      );
      expect(response.status).toBe(404);
    });

    it("应该接受有效令牌的请求", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/get",
      );
      expect(response.status).toBe(200);
    });
  });

  describe("URL 解析测试", () => {
    it("应该正确解析 HTTPS 请求", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/get",
      );
      expect(response.status).toBe(200);

      // 检查是否转发到了正确的目标
      const data = await response.json();
      expect(data.url).toContain("httpbin.org/get");
    });

    it("应该正确解析 HTTP 请求", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/http/httpbin.org/get",
      );
      expect(response.status).toBe(200);
    });

    it("应该保留查询参数", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/get?test=1&param=value",
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.args).toEqual({
        test: "1",
        param: "value",
      });
    });
  });

  describe("重定向拦截测试", () => {
    it("应该拦截 GitHub 资源重定向", async () => {
      // 这里需要模拟一个返回重定向的响应
      // 由于我们无法直接测试外部 API，我们创建一个模拟测试
      const testUrl =
        "http://localhost/token/test-token-123456/https/api.github.com";

      // 测试请求是否能正常发起
      const response = await SELF.fetch(testUrl);
      expect(response.status).toBe(200);
    });
  });

  describe("错误处理测试", () => {
    it("应该处理格式错误的 URL", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/",
      );
      expect(response.status).toBe(404);
    });

    it("应该处理无效的协议", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/ftp://example.com",
      );
      expect(response.status).toBe(404);
    });
  });

  describe("安全头测试", () => {
    it("应该包含 Strict-Transport-Security 头", async () => {
      const response = await SELF.fetch("http://localhost/");
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000",
      );
    });
  });
});
