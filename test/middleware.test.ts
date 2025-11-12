import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("中间件测试", () => {
  describe("fetchMiddleWare 测试", () => {
    it("应该正确处理嵌套的 token 模式", async () => {
      // 测试嵌套的 token 模式处理
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/http/httpbin.org/token/test-token-123456/https/example.com",
      );
      // 这个请求应该能正确解析
      expect([200, 404]).toContain(response.status);
    });

    it("应该正确处理循环前缀", async () => {
      // 测试循环处理多重前缀的逻辑
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/http/httpbin.org/token/test-token-123456/http/httpbin.org/anything",
      );
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("ReverseProxy 中间件测试", () => {
    it("应该正确添加 Forwarded 头", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/anything",
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      // 验证 Forwarded 头是否正确添加
      expect(JSON.stringify(data.headers).toLowerCase()).toContain("forwarded");
    });

    it("应该保持请求方法和 body", async () => {
      const testBody = JSON.stringify({ test: "data" });
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/anything",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: testBody,
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.json).toEqual({ test: "data" });
      expect(data.method).toBe("POST");
    });

    it("应该正确处理 HEAD 请求", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/anything",
        {
          method: "HEAD",
        },
      );

      expect(response.status).toBe(200);
    });
  });

  describe("Strict_Transport_Security 中间件测试", () => {
    it("应该为所有响应添加 HSTS 头", async () => {
      const response = await SELF.fetch("http://localhost/");
      expect(response.status).toBe(200);
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000",
      );
    });

    it("应该保持响应状态码和 body", async () => {
      const response = await SELF.fetch("http://localhost/");
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain("ok");
    });

    it("应该为代理请求也添加 HSTS 头", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/anything",
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000",
      );
    });
  });

  describe("错误处理中间件测试", () => {
    it("应该正确处理网络错误", async () => {
      // 使用一个无效的域名来测试错误处理
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/invalid-domain-for-testing.local/test",
      );
      expect(response.status).toBe(502);

      const text = await response.text();
      expect(text).toContain("bad gateway");
    });

    it("应该保持错误响应的 HSTS 头", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/invalid-domain-for-testing.local/test",
      );
      expect(response.status).toBe(502);
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000",
      );
    });
  });
});
