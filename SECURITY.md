# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not open a public issue**.

Instead, use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) feature to report it confidentially.

## Scope

This is a personal/educational project designed for two private users. While security best practices are applied (RLS, server-side secrets, JWT authentication), it is not designed for multi-tenant public use.

## Secret Handling

- **Never** commit API keys, tokens, or credentials to this repository
- **Never** share Supabase service role keys publicly
- All third-party API secrets are managed server-side via Supabase Edge Function environment variables
- Client-side code never contains or transmits API secrets
