import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { GaxiosError } from "gaxios";
import { docs_v1, drive_v3, google } from "googleapis";

export abstract class BaseToolHandler {
  abstract runTool(
    args: any,
    oauth2Client: OAuth2Client,
  ): Promise<CallToolResult>;

  protected handleGoogleApiError(error: unknown): never {
    if (error instanceof GaxiosError) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      // Handle specific Google API errors with appropriate MCP error codes
      if (errorData?.error === "invalid_grant") {
        throw new McpError(
          ErrorCode.InvalidRequest,
          "Authentication token is invalid or expired. Please re-run the authentication process (e.g., `npm run auth`).",
        );
      }

      if (status === 403) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Access denied: ${errorData?.error?.message || "Insufficient permissions"}`,
        );
      }

      if (status === 404) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Resource not found: ${errorData?.error?.message || "The requested calendar or event does not exist"}`,
        );
      }

      if (status === 429) {
        throw new McpError(
          ErrorCode.InternalError,
          "Rate limit exceeded. Please try again later.",
        );
      }

      if (status && status >= 500) {
        throw new McpError(
          ErrorCode.InternalError,
          `Google API server error: ${errorData?.error?.message || error.message}`,
        );
      }

      // Generic Google API error
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Google API error: ${errorData?.error?.message || error.message}`,
      );
    }

    // Handle non-Google API errors
    if (error instanceof Error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Internal error: ${error.message}`,
      );
    }

    throw new McpError(ErrorCode.InternalError, "An unknown error occurred");
  }

  protected getDocs(auth: OAuth2Client): docs_v1.Docs {
    return google.docs({
      version: "v1",
      auth,
      timeout: 3000, // 3 second timeout for API calls
    });
  }

  protected getDrive(auth: OAuth2Client): drive_v3.Drive {
    return google.drive({
      version: "v3",
      auth,
      timeout: 3000, // 3 second timeout for API calls
    });
  }
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    return Promise.race([promise, timeoutPromise]);
  }
  /**
   * Gets Google Doc details (structure/content) via Docs API
   * @param client OAuth2Client
   * @param documentId Docs document ID to fetch
   * @returns Docs API Document
   */
  protected async getDocumentDetails(
    client: OAuth2Client,
    documentId: string,
  ): Promise<docs_v1.Schema$Document> {
    try {
      const docs = this.getDocs(client);
      const response = await this.withTimeout(
        docs.documents.get({ documentId }),
      );
      if (!response.data) {
        throw new Error(`Document ${documentId} not found`);
      }
      return response.data;
    } catch (error) {
      throw this.handleGoogleApiError(error);
    }
  }

  /**
   * Gets Drive file metadata for a Doc (name, parents, owners, mimeType, etc.)
   * @param client OAuth2Client
   * @param fileId Drive file ID (same as Docs documentId)
   * @returns Drive File metadata
   */
  protected async getDriveFileDetails(
    client: OAuth2Client,
    fileId: string,
  ): Promise<drive_v3.Schema$File> {
    try {
      const drive = this.getDrive(client);
      const response = await this.withTimeout(drive.files.get({ fileId }));
      if (!response.data) {
        throw new Error(`File ${fileId} not found`);
      }
      return response.data;
    } catch (error) {
      throw this.handleGoogleApiError(error);
    }
  }
}
