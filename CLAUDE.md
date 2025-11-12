# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development Commands

- **Start local development**: `npm run dev` or `wrangler dev`
- **Deploy to Cloudflare Workers**: `npm run deploy` or `wrangler deploy`
- **Format code**: `npm run format` (uses Prettier)
- **Type checking**: `npx tsc --noEmit` (TypeScript compilation check)

## Project Architecture

This is a Cloudflare Workers reverse proxy with token-based authentication and
redirect interception capabilities.

### Core Architecture Flow

1. **Entry Point** (`src/index.ts`): Main Worker entry that orchestrates
   middleware chain
2. **Middleware Pipeline**: Uses chain-of-responsibility pattern with
   `fetchMiddleWare` → `Strict_Transport_Security`
3. **Token Authentication**: `fetchMiddleWare.ts` validates tokens and extracts
   target URLs from `/token/{token}/{protocol}/{host}` patterns
4. **Reverse Proxy**: `ReverseProxy.ts` handles HTTP forwarding with redirect
   interception for GitHub assets
5. **Security Headers**: `Strict_Transport_Security.ts` injects HSTS headers to
   all responses

### Key Components

- **fetchMiddleWare.ts**: Core authentication and URL parsing logic
  - Validates token against environment variable
  - Handles multi-protocol (HTTP/HTTPS) URL extraction
  - Supports nested token patterns for recursive proxying
- **ReverseProxy.ts**: Proxy engine with redirect interception
  - Forwards requests with proper header management
  - Intercepts redirects from GitHub domains
    (`release-assets.githubusercontent.com`, `raw.githubusercontent.com`)
  - Rewrites redirect locations to stay within proxy
- **CloudflareMiddleWare.ts**: TypeScript interfaces for middleware chain
- **Strict_Transport_Security.ts**: Security header injection middleware

### Configuration

- **Environment**: Configure token in `wrangler.toml` under `[vars]` section
- **Redirect Domains**: Modify `REDIRECT_域名前缀` array in `ReverseProxy.ts` to
  add new domains for interception
- **Security**: All responses get HSTS headers automatically

### Request Flow Pattern

```
Request: /token/{token}/https/{host}/{path}
→ Token validation in fetchMiddleWare
→ URL extraction and parsing
→ Forward to ReverseProxy with token
→ HTTP request to target with Forwarded headers
→ Response with potential redirect interception
→ HSTS header injection
→ Final response
```

### TypeScript Configuration

- Target: ES2021 with ES2022 modules
- Cloudflare Workers types included
- Strict mode enabled with `noEmit: true` (wrangler handles compilation)
- Allows importing TypeScript extensions

### Development Notes

- Use `wrangler dev` for local testing at `http://localhost:8787`
- Token authentication is required for all proxy requests
- Redirect interception specifically targets GitHub asset domains to ensure
  downloads go through the proxy
- All middleware follows the `CloudflareMiddleWare<Env>` interface pattern
