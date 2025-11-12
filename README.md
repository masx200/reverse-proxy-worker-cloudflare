# 🌐 Reverse Proxy Worker for Cloudflare

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](https://www.typescriptlang.org/)

A powerful and flexible reverse proxy solution built for Cloudflare Workers with
advanced features including token-based authentication, redirect interception,
and comprehensive header management.

## ✨ Features

- 🔐 **Token-Based Authentication** - Secure access control using configurable
  tokens
- 🔄 **Redirect Interception** - Automatically intercepts and rewrites GitHub
  asset redirects
- 🌍 **Multi-Protocol Support** - Supports both HTTP and HTTPS protocols
- 📝 **Comprehensive Logging** - Detailed request/response logging for debugging
- 🔧 **Configurable Behavior** - Customizable redirect handling via headers
- ⚡ **High Performance** - Built on Cloudflare's edge network
- 🛡️ **Security Headers** - Automatic security header injection
- 📊 **Request Tracking** - Full request/response tracking with Forwarded
  headers

## 🚀 Quick Start

### Prerequisites

- A Cloudflare Workers account
- Node.js (for local development)
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/masx200/reverse-proxy-worker-cloudflare.git
   cd reverse-proxy-worker-cloudflare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables in `wrangler.toml`:
   ```toml
   [vars]
   token = "your-secret-token-here"
   ```

4. Deploy to Cloudflare Workers:
   ```bash
   wrangler publish
   ```

### Local Development

Start the local development server:

```bash
wrangler dev
```

The worker will be available at `http://localhost:8787`.

## 📖 Usage

### Basic Proxy Requests

Use the following URL pattern to proxy requests:

```
https://your-worker.workers.dev/token/{TOKEN}/{PROTOCOL}/{HOST}/{PATH}
```

#### Examples:

```bash
# HTTPS request
https://your-worker.workers.dev/token/your-token/https/www.example.com/path

# HTTP request
https://your-worker.workers.dev/token/your-token/http/example.com

# With query parameters
https://your-worker.workers.dev/token/your-token/https/api.github.com/users/octocat?sort=created
```

### Local Development URLs

```bash
# HTTPS example
http://localhost:8787/token/your-token/https/www.360.cn

# HTTP example
http://localhost:8787/token/your-token/http/example.com
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description                              | Example               |
| -------- | -------- | ---------------------------------------- | --------------------- |
| `token`  | Yes      | Authentication token for securing access | `my-secret-token-123` |

### Request Headers

#### Custom Redirect Behavior

Control redirect handling using the `x-proxy-redirect` header:

| Value    | Description                                       |
| -------- | ------------------------------------------------- |
| `manual` | Default - manually handle redirects (recommended) |
| `follow` | Automatically follow redirects                    |
| `error`  | Treat redirects as errors                         |

**Example:**

```bash
curl -H "x-proxy-redirect: manual" \
     https://your-worker.workers.dev/token/your-token/https/api.github.com
```

## 🔄 Redirect Interception

The proxy automatically intercepts redirects from the following domains and
rewrites them to go through the proxy:

- `https://release-assets.githubusercontent.com`
- `https://raw.githubusercontent.com`

**Example Flow:**

1. Request: `/token/your-token/https/api.github.com/releases/assets/12345`
2. Original Redirect: `https://release-assets.githubusercontent.com/12345`
3. Intercepted Redirect:
   `/token/your-token/https/release-assets.githubusercontent.com/12345`

This ensures all GitHub asset downloads go through the proxy for consistent
access.

## 🛡️ Security Features

### Automatic Security Headers

The proxy automatically adds the following security headers to responses:

- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Content-Security-Policy`
- `Permissions-Policy`

### Forwarded Headers

All requests include comprehensive `Forwarded` headers for transparency:

- Protocol information
- Host information
- Proxy identification
- Client IP address

## 📝 Logging & Debugging

The proxy provides detailed logging for all requests and responses:

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

For redirect interception, additional logs are provided:

```json
{
  "message": "重定向拦截",
  "originalLocation": "https://release-assets.githubusercontent.com/file",
  "newLocation": "/token/your-token/https/release-assets.githubusercontent.com/file",
  "status": 302
}
```

## 🔧 Advanced Configuration

### Custom Token Implementation

You can extend the token authentication by modifying the `fetchMiddleWare.ts`
file:

```typescript
// Add custom authentication logic
const isValidToken = (token: string) => {
  // Implement your custom validation logic
  return token === env.token || validateAgainstDatabase(token);
};
```

### Adding New Redirect Domains

To add more domains for redirect interception, modify `ReverseProxy.ts`:

```typescript
const REDIRECT_域名前缀 = [
  "https://release-assets.githubusercontent.com",
  "https://raw.githubusercontent.com",
  "https://your-custom-domain.com", // Add your domain here
];
```

## 🚨 Error Handling

The proxy provides comprehensive error handling:

| Status Code | Description              | Solution                         |
| ----------- | ------------------------ | -------------------------------- |
| `401`       | Invalid or missing token | Check your token configuration   |
| `502`       | Upstream server error    | Check target server availability |
| `404`       | Invalid endpoint         | Verify your proxy URL format     |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by [TypeScript](https://www.typescriptlang.org/)
- Inspired by the need for reliable proxy solutions in enterprise environments

## 📞 Support

If you encounter any issues or have questions:

1. Check the
   [Issues](https://github.com/masx200/reverse-proxy-worker-cloudflare/issues)
   page
2. Create a new issue with detailed information
3. Join our discussions for community support

---

<div align="center">

**⭐ Star this repository if it helped you!**

Made with ❤️ by [Your Name](https://github.com/masx200)

</div>
