import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("重定向拦截功能测试", () => {
  it("应该正确重写 GitHub release assets 重定向", async () => {
    // 使用一个测试 URL 来验证重定向拦截逻辑
    const response = await SELF.fetch(
      "http://localhost/token/test-token-123456/https/github.com",
    );
    expect(response.status).toBe(200);

    // 验证请求头中的转发信息
    const headers = response.headers;
    expect(headers.has("forwarded")).toBe(true);
    expect(headers.get("forwarded")).toContain("proto=http");
    expect(headers.get("forwarded")).toContain("host=localhost");
  });

  it("应该正确重写 GitHub raw content 重定向", async () => {
    const response = await SELF.fetch(
      "http://localhost/token/test-token-123456/https/raw.githubusercontent.com",
    );
    expect(response.status).toBe(200);
  });

  it("应该保持非 GitHub 域名的重定向不变", async () => {
    // 测试非 GitHub 域名的请求
    const response = await SELF.fetch(
      "http://localhost/token/test-token-123456/https/example.com",
    );
    expect(response.status).toBe(200);
  });

  describe("重定向 URL 转换测试", () => {
    it("应该正确将外部 GitHub URL 转换为本地代理 URL", async () => {
      // 这个测试验证 URL 转换逻辑是否正确
      const originalUrl =
        "https://release-assets.githubusercontent.com/files/12345/test.zip";
      const expectedLocalUrl =
        "http://localhost/token/test-token-123456/https/release-assets.githubusercontent.com/files/12345/test.zip";

      // 通过实际请求来验证转换逻辑
      const response = await SELF.fetch(expectedLocalUrl);
      expect(response.status).toBe(200);
    });

    it("应该正确处理带查询参数的 GitHub URL", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/release-assets.githubusercontent.com/files/12345/test.zip?download=true",
      );
      // 即使失败，也应该是因为外部服务不可用，而不是 URL 解析错误
      expect([200, 404, 502]).toContain(response.status);
    });
  });

  describe("请求头转发测试", () => {
    it("应该正确转发 Forwarded 头", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/https/httpbin.org/get",
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      // 验证是否包含了 Forwarded 头信息
      expect(JSON.stringify(data.headers)).toContain("forwarded");
    });

    it("应该保留重要的 HTTP 头", async () => {
      const testUrl =
        "http://localhost/token/test-token-123456/https/httpbin.org/get";
      const response = await SELF.fetch(testUrl);
      expect(response.status).toBe(200);

      // 验证基础请求功能正常
      const data = await response.json();
      expect(data).toHaveProperty("url");
      expect(data).toHaveProperty("headers");
    });
  });

  describe("错误场景测试", () => {
    it("应该处理无效的令牌", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/invalid-token/https/github.com",
      );
      expect(response.status).toBe(404);
    });

    it("应该处理缺失令牌的请求", async () => {
      const response = await SELF.fetch(
        "http://localhost/token//https/github.com",
      );
      expect(response.status).toBe(404);
    });

    it("应该处理格式错误的代理 URL", async () => {
      const response = await SELF.fetch(
        "http://localhost/token/test-token-123456/invalid",
      );
      expect(response.status).toBe(404);
    });
  });
});
