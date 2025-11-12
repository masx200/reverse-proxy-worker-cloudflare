# 🌐 Cloudflare Workers 反向代理

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](https://www.typescriptlang.org/)

基于 Cloudflare Workers
构建的强大而灵活的反向代理解决方案，具备高级功能，包括基于令牌的身份验证、重定向拦截和全面的请求头管理。

## ✨ 功能特性

- 🔐 **令牌身份验证** - 使用可配置令牌进行安全访问控制
- 🔄 **重定向拦截** - 自动拦截并重写 GitHub 资源重定向
- 🌍 **多协议支持** - 支持 HTTP 和 HTTPS 协议
- 📝 **全面日志记录** - 详细的请求/响应日志用于调试
- 🔧 **可配置行为** - 通过请求头自定义重定向处理
- ⚡ **高性能** - 基于 Cloudflare 边缘网络构建
- 🛡️ **安全头** - 自动注入安全头
- 📊 **请求跟踪** - 使用转发头进行完整的请求/响应跟踪

## 🚀 快速开始

### 前置要求

- Cloudflare Workers 账户
- Node.js（用于本地开发）
- Wrangler CLI（`npm install -g wrangler`）

### 安装

1. 克隆此仓库：
   ```bash
   git clone https://github.com/masx200/reverse-proxy-worker-cloudflare.git
   cd reverse-proxy-worker-cloudflare
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 在 `wrangler.toml` 中配置环境变量：
   ```toml
   [vars]
   token = "your-secret-token-here"
   ```

4. 部署到 Cloudflare Workers：
   ```bash
   wrangler publish
   ```

### 本地开发

启动本地开发服务器：

```bash
wrangler dev
```

服务将在 `http://localhost:8787` 上可用。

## 📖 使用方法

### 基本代理请求

使用以下 URL 模式来代理请求：

```
https://your-worker.workers.dev/token/{TOKEN}/{PROTOCOL}/{HOST}/{PATH}
```

#### 示例：

```bash
# HTTPS 请求
https://your-worker.workers.dev/token/your-token/https/www.example.com/path

# HTTP 请求
https://your-worker.workers.dev/token/your-token/http/example.com

# 带查询参数
https://your-worker.workers.dev/token/your-token/https/api.github.com/users/octocat?sort=created
```

### 本地开发 URL

```bash
# HTTPS 示例
http://localhost:8787/token/your-token/https/www.360.cn

# HTTP 示例
http://localhost:8787/token/your-token/http/example.com
```

## ⚙️ 配置

### 环境变量

| 变量    | 必需 | 描述                       | 示例                  |
| ------- | ---- | -------------------------- | --------------------- |
| `token` | 是   | 用于保护访问的身份验证令牌 | `my-secret-token-123` |

### 请求头

#### 自定义重定向行为

使用 `x-proxy-redirect` 头控制重定向处理：

| 值       | 描述                          |
| -------- | ----------------------------- |
| `manual` | 默认 - 手动处理重定向（推荐） |
| `follow` | 自动跟随重定向                |
| `error`  | 将重定向视为错误              |

**示例：**

```bash
curl -H "x-proxy-redirect: manual" \
     https://your-worker.workers.dev/token/your-token/https/api.github.com
```

## 🔄 重定向拦截

代理会自动拦截来自以下域名的重定向并将其重写为通过代理访问：

- `https://release-assets.githubusercontent.com`
- `https://raw.githubusercontent.com`

**示例流程：**

1. 请求：`/token/your-token/https/api.github.com/releases/assets/12345`
2. 原始重定向：`https://release-assets.githubusercontent.com/12345`
3. 拦截后的重定向：`/token/your-token/https/release-assets.githubusercontent.com/12345`

这确保所有 GitHub 资源下载都通过代理进行一致访问。

## 🛡️ 安全功能

### 自动安全头

代理会自动向响应添加以下安全头：

- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Content-Security-Policy`
- `Permissions-Policy`

### 转发头

所有请求都包含全面的 `Forwarded` 头以确保透明度：

- 协议信息
- 主机信息
- 代理标识
- 客户端 IP 地址

## 📝 日志记录和调试

代理为所有请求和响应提供详细的日志记录：

```json
{
  "request": {
    "method": "GET",
    "url": "https://example.com",
    "Headers": {
      "user-agent": "Mozilla/5.0...",
      "accept": "application/json"
    }
  }
}
```

对于重定向拦截，提供额外的日志：

```json
{
  "message": "重定向拦截",
  "originalLocation": "https://release-assets.githubusercontent.com/file",
  "newLocation": "/token/your-token/https/release-assets.githubusercontent.com/file",
  "status": 302
}
```

## 🔧 高级配置

### 自定义令牌实现

您可以通过修改 `fetchMiddleWare.ts` 文件来扩展令牌身份验证：

```typescript
// 添加自定义身份验证逻辑
const isValidToken = (token: string) => {
  // 实现您的自定义验证逻辑
  return token === env.token || validateAgainstDatabase(token);
};
```

### 添加新的重定向域名

要添加更多域名进行重定向拦截，请修改 `ReverseProxy.ts`：

```typescript
const REDIRECT_域名前缀 = [
  "https://release-assets.githubusercontent.com",
  "https://raw.githubusercontent.com",
  "https://your-custom-domain.com", // 在此添加您的域名
];
```

## 🚨 错误处理

代理提供全面的错误处理：

| 状态码 | 描述           | 解决方案             |
| ------ | -------------- | -------------------- |
| `401`  | 令牌无效或缺失 | 检查令牌配置         |
| `502`  | 上游服务器错误 | 检查目标服务器可用性 |
| `404`  | 端点无效       | 验证代理 URL 格式    |

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 此仓库
2. 创建功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 打开 Pull Request

## 📄 许可证

此项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 使用 [Cloudflare Workers](https://workers.cloudflare.com/) 构建
- 由 [TypeScript](https://www.typescriptlang.org/) 提供支持
- 灵感来源于企业环境对可靠代理解决方案的需求

## 📞 支持

如果您遇到任何问题或有疑问：

1. 查看
   [Issues](https://github.com/masx200/reverse-proxy-worker-cloudflare/issues)
   页面
2. 创建包含详细信息的新问题
3. 加入我们的讨论以获得社区支持

---

<div align="center">

**⭐ 如果这个仓库对您有帮助，请给个 Star！**

由 [Your Name](https://github.com/masx200) 用 ❤️ 制作

</div>
