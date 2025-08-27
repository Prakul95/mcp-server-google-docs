# Google Docs MCP Server

A Model Context Protocol (MCP) server that lets AI assistants (e.g., Claude) work directly with your Google Docs. It can **list Google Docs in Drive**, **fetch entire document content**, **generate quick previews**, and **create & edit Docs**—all through MCP tools.

> Perfect for drafting, summarizing, outlining, note‑taking, and collaborative edits without leaving chat.

---

## ✨ Features

- **List Docs (Drive, Docs only)** – Query your Drive for Google Docs (`application/vnd.google-apps.document`) with title, ID, and metadata. Supports folder scoping and extra Drive query parameters.
- **Get full document** – Retrieve the complete Google Docs structure (suitable for summarization, analysis, and formatting). _Supports fetching tab content._
- **Create Docs** – Spin up a new Doc with an initial title and (optionally) place it inside a Drive folder.
- **Update Docs** – Apply edits to an existing Doc (insert/append text, headings/paragraph styles, replacements).
- **Copy Docs** - Creates a copy of an existing Doc.

---

## 🧰 Tools exposed by the server (exact names)

These tool names reflect your implementation:

- `list-docs` — List Google Docs from Drive. Can filter by **folder ID** and **additional Drive query parameters**.
- `get-doc` — Retrieve a Google Doc’s metadata and/or content. **Supports fetching tab content.**
- `create-doc` — Create a new **blank** Google Doc with a given title. Optionally place it in a Drive folder.
- `update-doc` — Update an existing Google Doc (e.g., insert/replace text, apply styles).
- `copy-doc` — copy an existing Google Doc optionally with a given title.

---
## Demo Video

[![Demo Video](https://img.youtube.com/vi/GsZ1WITEu_0/0.jpg)](https://youtu.be/GsZ1WITEu_0) 

## 🧪 Example prompts (Claude / MCP client)

```text
1. Get me a list of all the docs created yesterday with AI in their name.
2. Get the doc xyz and show details.
3. Get the same doc and show a preview of 400 chars.
4. Summarize the doc
5. Create a doc with name new_file_name
6. Add list of commands in this doc and write it in a fashion that explains the intent of this doc. Also add the current temp and lunar phase of the moon today.
7. Update this list with 5 random cities from Washington and add the temp of those cities as well.

```

---

## 🔐 Google Cloud Setup

1. Open **Google Cloud Console** and create/select a project.
2. **Enable APIs** for the project:
   - **Google Docs API**
   - **Google Drive API**
3. **Create OAuth 2.0 credentials**:
   - Type: **Desktop app** (recommended for local MCP clients).
   - Download the credentials JSON and save it locally (e.g., `gcp-oauth.keys.json`).
4. While the app is in **Test mode**, add your Google account under **OAuth consent screen → Test users**.

**Recommended scopes (least‑privilege):**

- **Read only:**
  - `https://www.googleapis.com/auth/documents.readonly`
  - `https://www.googleapis.com/auth/drive.metadata.readonly`
- **Read/Write (create & edit):**
  - `https://www.googleapis.com/auth/documents`
  - `https://www.googleapis.com/auth/drive.file` (or `drive` if you truly need broad access)

> Tokens issued in _Test mode_ often expire in ~7 days; you can re‑auth when prompted or publish the app to extend token lifetimes.

---

## ⚙️ Install & Run

### Prerequisites

- **Node.js LTS** (v18+ recommended)
- **npm** or **pnpm**

### Local install

```bash
git clone https://github.com/Prakul95/mcp-server-google-docs.git
cd mcp-server-google-docs
npm install
npm run build
```

### Start the server (stdio MCP)
// TBA ypu can build the project and directluy update the claude_desktop_config.json, steps mentioned below
```bash
# From repo root
npm start             # if defined in package.json
# or explicitly:
node ./dist/server.js
```

---

## 🖥️ Configure your MCP client

### Claude Desktop

Edit:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add an entry like:

```json
{
  "mcpServers": {
    "google-docs": {
      "command": "node",
      "args": ["<absolute-path-to>/mcp-server-google-docs/dist/server.js"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "<absolute-path-to>/gcp-oauth.keys.json"
      }
    }
  }
}
```

> Tip: While iterating, you can wire up a dev command (e.g., `tsx src/server.ts`) if you prefer to run TypeScript directly.

### Cursor / other MCP clients

Use the MCP configuration UI or a JSON config similar to the above (pointing to the built server). Ensure the `GOOGLE_OAUTH_CREDENTIALS` env var points to your credentials JSON.

---

## 🔑 Authentication flow

- On the first call, your MCP client will open a browser window for Google OAuth.
- Tokens are stored locally (location depends on your client/server setup).
- If you see auth errors, verify:
  - Your OAuth client is of type **Desktop**.
  - Your user is added under **Test users** (if app is in test mode).
  - `GOOGLE_OAUTH_CREDENTIALS` points to a **valid** credentials JSON file.

### Re‑authentication (Test Mode)

- Expect token expiry roughly weekly in test mode.
- Re‑run your client and complete the OAuth prompt again.
- Publishing the app reduces re‑auth frequency (expect an “unverified app” banner).

---

## 🧪 Quick sanity checks

TBA

---

## 🛡️ Security notes

- Keep `gcp-oauth.keys.json` **out of version control**.
- Prefer **least‑privilege scopes** unless you truly need write access.
- Be mindful that logs may include tool inputs. Avoid logging sensitive data in production.

---

## 🧩 Implementation details (high level)

- **Drive listing** uses the Drive API with `mimeType = 'application/vnd.google-apps.document'` filters; combined with folder and custom Drive query.
- **Full document fetch** uses the Docs API `documents.get` to return structured content (paragraphs, tables, etc.).
- **Create/update** use Docs API `documents.create` and `documents.batchUpdate` with structured operations.

---

## ❓ Troubleshooting

1. **Credentials file not found**
   - Ensure `GOOGLE_OAUTH_CREDENTIALS` points to an **absolute** path.
2. **“This app isn’t verified”**
   - Expected for unpublished apps. You can proceed (or publish).
3. **Auth keeps expiring**
   - Normal in test mode; re‑auth or publish the app.
4. **403 / insufficient permissions**
   - Add missing scopes (e.g., `documents` for write, `drive.file` for creating files).
5. **Docs list is empty**
   - Check your folder filter / Drive query and confirm the account has Docs in Drive.

---

## 📄 License

MIT

---

## 🙌 Acknowledgements

- Setup flow inspired by community MCP servers (e.g., Google Calendar variants); adapted here for Google Docs tooling.
