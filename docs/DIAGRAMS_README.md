# Architecture Diagrams

All Mermaid architecture diagrams have been generated as both PNG and SVG images.

## 📂 File Structure

```
prismaCrud/
├── diagrams/              # Source Mermaid files (.mmd)
│   ├── oauth-sequence.mmd
│   ├── system-architecture.mmd
│   ├── database-schema.mmd
│   ├── oauth-state-machine.mmd
│   ├── cookie-flow.mmd
│   ├── error-handling.mmd
│   └── auth-comparison.mmd
│
└── docs/diagrams/         # Generated images
    ├── oauth-sequence.png
    ├── oauth-sequence.svg
    ├── system-architecture.png
    ├── system-architecture.svg
    ├── database-schema.png
    ├── database-schema.svg
    ├── oauth-state-machine.png
    ├── oauth-state-machine.svg
    ├── cookie-flow.png
    ├── cookie-flow.svg
    ├── error-handling.png
    ├── error-handling.svg
    ├── auth-comparison.png
    └── auth-comparison.svg
```

## 🎨 Available Diagrams

### 1. OAuth Sequence Diagram
**Files:** `oauth-sequence.png` / `oauth-sequence.svg`

Shows the complete OAuth 2.0 authentication flow from user clicking "Continue with Google" to successful login.

### 2. System Architecture
**Files:** `system-architecture.png` / `system-architecture.svg`

Component diagram showing the frontend, backend, and external services with their interactions.

### 3. Database Schema (ERD)
**Files:** `database-schema.png` / `database-schema.svg`

Entity-Relationship Diagram showing User, UserPost, and RefreshToken models with their relationships.

### 4. OAuth State Machine
**Files:** `oauth-state-machine.png` / `oauth-state-machine.svg`

State diagram showing all possible states during OAuth authentication including error states.

### 5. Cookie & Token Flow
**Files:** `cookie-flow.png` / `cookie-flow.svg`

Detailed flow of OAuth state cookies, JWT generation, and cookie-based authentication.

### 6. Error Handling Flow
**Files:** `error-handling.png` / `error-handling.svg`

Decision tree showing how errors are handled during OAuth callback, including user cancellation.

### 7. Authentication Methods Comparison
**Files:** `auth-comparison.png` / `auth-comparison.svg`

Side-by-side comparison of Local Authentication vs OAuth Authentication flows.

## 📖 Using the Diagrams

### In Documentation
```markdown
![OAuth Flow](docs/diagrams/oauth-sequence.png)
```

### In README
Add to your README.md:
```markdown
## Architecture

![System Architecture](docs/diagrams/system-architecture.png)

For complete documentation, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
```

### In Presentations
- **PNG files**: Good for PowerPoint, Google Slides, or when you need raster images
- **SVG files**: Best for web, scalable without quality loss, smaller file size

### In GitHub
GitHub will automatically render both PNG and SVG files in markdown.

## 🔄 Regenerating Diagrams

If you update the source `.mmd` files, regenerate images:

### Single Diagram
```bash
npx -p @mermaid-js/mermaid-cli mmdc -i diagrams/oauth-sequence.mmd -o docs/diagrams/oauth-sequence.png -w 1920 -b transparent
```

### All Diagrams (Windows)
```bash
cd diagrams
for %f in (*.mmd) do npx -p @mermaid-js/mermaid-cli mmdc -i %f -o ../docs/diagrams/%~nf.png -w 1920 -b transparent
```

### All Diagrams (Mac/Linux)
```bash
for file in diagrams/*.mmd; do
  npx -p @mermaid-js/mermaid-cli mmdc -i "$file" -o "docs/diagrams/$(basename "$file" .mmd).png" -w 1920 -b transparent
done
```

## 📊 Diagram Sizes

| Diagram | PNG Size | SVG Size |
|---------|----------|----------|
| OAuth Sequence | 105 KB | 32 KB |
| System Architecture | 75 KB | 29 KB |
| Database Schema | 45 KB | 57 KB |
| OAuth State Machine | 130 KB | 799 KB |
| Cookie Flow | 25 KB | 32 KB |
| Error Handling | 150 KB | 53 KB |
| Auth Comparison | 54 KB | 29 KB |
| **Total** | ~584 KB | ~1.0 MB |

## 💡 Tips

1. **For Web**: Use SVG files for better quality and smaller size
2. **For Print**: Use PNG files at high resolution (1920px width)
3. **For Editing**: Edit the `.mmd` source files and regenerate
4. **Version Control**: Commit both source `.mmd` files and generated images

## 🛠️ Mermaid CLI Options

```bash
# Basic generation
mmdc -i input.mmd -o output.png

# Custom width
mmdc -i input.mmd -o output.png -w 1920

# Transparent background
mmdc -i input.mmd -o output.png -b transparent

# Dark theme
mmdc -i input.mmd -o output.png -t dark

# SVG output
mmdc -i input.mmd -o output.svg

# PDF output
mmdc -i input.mmd -o output.pdf
```

## 📚 Resources

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [PROJECT_DOCUMENTATION.md](../PROJECT_DOCUMENTATION.md) - Complete project docs

---

**Generated:** March 4, 2026  
**Total Diagrams:** 7 diagrams × 2 formats = 14 files
