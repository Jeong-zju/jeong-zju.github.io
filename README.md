# zihaoli.dev

Dependency-free static portfolio for Zihao Li, ready for Cloudflare Pages.

## Local preview

```bash
python3 -m http.server 8788 --directory .
```

## Cloudflare Pages

- Framework preset: `None`
- Build command: leave empty
- Build output directory: `zihaoli.dev` from the workspace root, or `.` if this directory is the repository root
- Production branch: `main`

Add `zihaoli.dev` under **Workers & Pages → project → Custom domains**. `_headers` and `_redirects` are consumed automatically.
