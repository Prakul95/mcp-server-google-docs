import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { log } from "./logger.js";
// import { getAuth } from "./auth/auth.js";
// import { listDocs } from "./google-tools/drive/google-drive.js";
// import { createDoc, getDoc, appendTextTop } from "./google-tools/docs/google-docs.js";
import { initializeOAuth2Client } from './auth/client.js';
import { AuthServer } from './auth/server.js';
import { TokenManager } from './auth/tokenManager.js';
// Import tool registry
import { ToolRegistry } from './tools/registry.js';

// Import transport handlers
import { StdioTransportHandler } from './transports/stdio.js';
import { HttpTransportHandler, HttpTransportConfig } from './transports/http.js';

// Minimal stdio MCP server with four tools

import { ServerConfig } from './config/TransportConfig.js';

export class GoogleDocsMcpServer {
  private server: McpServer;
  private oauth2Client!: OAuth2Client;
  private tokenManager!: TokenManager;
  private authServer!: AuthServer;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.server = new McpServer({
      name: "google-docs",
      version: "0.1.0"
    });
  }

  async initialize(): Promise<void> {
    // 1. Initialize Authentication (but don't block on it)
    this.oauth2Client = await initializeOAuth2Client();
    this.tokenManager = new TokenManager(this.oauth2Client);
    this.authServer = new AuthServer(this.oauth2Client);

    // 2. Handle startup authentication based on transport type
    await this.handleStartupAuthentication();

    // 3. Set up Modern Tool Definitions
    this.registerTools();

    // 4. Set up Graceful Shutdown
    this.setupGracefulShutdown();
  }

  private async handleStartupAuthentication(): Promise<void> {
    // Skip authentication in test environment
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const accountMode = this.tokenManager.getAccountMode();
    if (this.config.transport.type === 'stdio') {
      // For stdio mode, ensure authentication before starting server
      const hasValidTokens = await this.tokenManager.validateTokens(accountMode);
      if (!hasValidTokens) {
        // Ensure we're using the correct account mode (don't override it)
        const authSuccess = await this.authServer.start(true); // openBrowser = true
        if (!authSuccess) {
          process.stderr.write(`Authentication failed for ${accountMode} account. Please check your OAuth credentials and try again.\n`);
          process.exit(1);
        }
        process.stderr.write(`Successfully authenticated user.\n`);
      } else {
        process.stderr.write(`Valid ${accountMode} user tokens found, skipping authentication prompt.\n`);
      }
    } else {
      // For HTTP mode, check for tokens but don't block startup
      const hasValidTokens = await this.tokenManager.validateTokens(accountMode);
      if (!hasValidTokens) {
        process.stderr.write(`⚠️  No valid ${accountMode} user authentication tokens found.\n`);
        process.stderr.write('Visit the server URL in your browser to authenticate, or run "npm run auth" separately.\n');
      } else {
        process.stderr.write(`Valid ${accountMode} user tokens found.\n`);
      }
    }
}
private registerTools(): void {
    ToolRegistry.registerAll(this.server, this.executeWithHandler.bind(this));
  }
private async ensureAuthenticated(): Promise<void> {
    // Check if we already have valid tokens
    if (await this.tokenManager.validateTokens()) {
      return;
    }
    // For stdio mode, authentication should have been handled at startup
    if (this.config.transport.type === 'stdio') {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "Authentication tokens are no longer valid. Please restart the server to re-authenticate."
      );
    }
    // For HTTP mode, try to start auth server if not already running
    try {
      const authSuccess = await this.authServer.start(false); // openBrowser = false for HTTP mode
      
      if (!authSuccess) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Authentication required. Please run 'npm run auth' to authenticate, or visit the auth URL shown in the logs for HTTP mode."
        );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new McpError(ErrorCode.InvalidRequest, error.message);
      }
      throw new McpError(ErrorCode.InvalidRequest, "Authentication required. Please run 'npm run auth' to authenticate.");
    }
}
private async executeWithHandler(handler: any, args: any): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    await this.ensureAuthenticated();
    const result = await handler.runTool(args, this.oauth2Client);
    return result;
  }
async start(): Promise<void> {
    switch (this.config.transport.type) {
      case 'stdio':
        const stdioHandler = new StdioTransportHandler(this.server);
        await stdioHandler.connect();
        break;
        
      case 'http':
        const httpConfig: HttpTransportConfig = {
          port: this.config.transport.port,
          host: this.config.transport.host
        };
        const httpHandler = new HttpTransportHandler(this.server, httpConfig);
        await httpHandler.connect();
        break;
        
      default:
        throw new Error(`Unsupported transport type: ${this.config.transport.type}`);
    }
  }
  private setupGracefulShutdown(): void {
    const cleanup = async () => {
      try {
        if (this.authServer) {
          await this.authServer.stop();
        }
        
        // McpServer handles transport cleanup automatically
        this.server.close();
        
        process.exit(0);
      } catch (error: unknown) {
        process.stderr.write(`Error during cleanup: ${error instanceof Error ? error.message : error}\n`);
        process.exit(1);
      }
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  // Expose server for testing
  getServer(): McpServer {
    return this.server;
  }
} 
// server(
//   {
//     name: "list_docs",
//     description: "List Google Docs via Drive. Optional Drive query string and pageSize.",
//   },
//   async ({ query, pageSize }: { query?: string; pageSize?: number }) => {
//     const auth = await getAuth();
//     const files = await listDocs(auth, query, pageSize ?? 10);
//     return { files };
//   }
// );
// server.tool()
// server.tool(
//   {
//     name: "create_doc",
//     description: "Create a Google Doc with a title.",
//     inputSchema: {
//       type: "object",
//       required: ["title"],
//       properties: { title: { type: "string" } }
//     }
//   },
//   async ({ title }: { title: string }) => {
//     const auth = await getAuth();
//     const doc = await createDoc(auth, title);
//     return {
//       id: doc.documentId,
//       title: doc.title,
//       url: doc.documentId ? `https://docs.google.com/document/d/${doc.documentId}/edit` : undefined
//     };
// //   }
// // );

// // server.tool(
// //   {
// //     name: "get_doc",
// //     description: "Fetch raw Google Docs document JSON.",
// //     inputSchema: {
// //       type: "object",
// //       required: ["docId"],
// //       properties: { docId: { type: "string" } }
// //     }
// //   },
// //   async ({ docId }: { docId: string }) => {
// //     const auth = await getAuth();
// //     const document = await getDoc(auth, docId);
// //     return { document };
// //   }
// // );

// server.tool(
//   {
//     name: "append_text",
//     description: "Insert plain text at the top of the document (index=1).",
//     inputSchema: {
//       type: "object",
//       required: ["docId", "text"],
//       properties: { docId: { type: "string" }, text: { type: "string" } }
//     }
//   },
//   async ({ docId, text }: { docId: string; text: string }) => {
//     const auth = await getAuth();
//     await appendTextTop(auth, docId, text);
//     return { ok: true } as const;
//   }
// );

// server.start();
// log.info("Google Docs MCP server started (stdio)");