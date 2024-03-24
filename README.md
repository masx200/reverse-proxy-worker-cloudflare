# reverse-proxy-worker-cloudflare

A reverse proxy worker for Cloudflare Workers.

## License

MIT License

# 设置环境变量访问秘钥

`token=token123456`

# 访问地址:

```
http://localhost:8787/token/token123456/https/www.360.cn
```

```
http://localhost:8787/token/token123456/http/example.com
```

# 设定代理行为的重定向方式

可以设定请求头中的字段"x-proxy-redirect"为"error" | "follow" |
"manual"来设定代理行为的重定向方式.
