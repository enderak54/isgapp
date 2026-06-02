<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-standards -->
# Project Standards — READ BEFORE CODING

## READ `STANDARDS.md` FIRST

The file `STANDARDS.md` contains ALL project conventions including:

### International Standards
- **ISO 45001** — 15 OHS module mappings (Clause 4.1 through 10.2)
- **ISO 27001** — Information security controls (A.9 through A.18)
- **KVKK/GDPR** — Personal data protection rules

### Security Standards (OWASP-aligned)
- CSP policy (unsafe-inline due to Next.js nonce incompatibility)
- Rate limiting (30 req/min per IP)
- XSS sanitization pattern (`sanitize()` / `sanitizeForm()`)
- Backup API auth (`x-api-key` header)
- TC Kimlik masking (`maskTC()`)

### Code Conventions
- **Date format:** `displayDate()` / `formatDate()` — always `DD.MM.YYYY` in UI
- **Audit log:** `logAudit()` on every INSERT/UPDATE/DELETE/ARCHIVE
- **Error handling:** `try/catch` + `editStatus` state + error/success banner
- **Search input:** `card p-4 mb-6 > relative > Search(right-4) > input pr-12`
- **File upload:** `validateFile()` + `sanitizeFileName()` (max 10MB)

### New Module Checklist (12 steps)
Migration → Component → Route → Sidebar → Settings toggle → Backup API label → Build verify → Audit log → try/catch → sanitizeForm → displayDate → ISO 45001 mapping update

### Known Security Gaps
1. RLS is PUBLIC (development mode) — switch to `auth.role() = 'authenticated'` before production
2. `BACKUP_API_KEY` not set in env — all backup requests return 401
3. 18 modules missing audit log
4. CSRF protection not implemented
5. No server-side file validation
6. Storage buckets are public

## CRITICAL: Always check existing code patterns before writing new code. Match the style, imports, and conventions of neighboring files.
<!-- END:project-standards -->
