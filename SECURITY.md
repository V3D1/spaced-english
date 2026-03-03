# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email: **maciej.kick77@gmail.com** with subject "spaced-english security"
3. Include steps to reproduce and potential impact
4. Allow 48 hours for initial response

## Security Measures

This application includes:

- **bcrypt** password hashing (cost factor 10)
- **JWT sessions** with HS256 signing and configurable TTL
- **Rate limiting** on login with progressive lockout
- **Honeypot field** to catch automated bots
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Zod validation** on all form inputs
- **No secrets in source** — all credentials via environment variables

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
