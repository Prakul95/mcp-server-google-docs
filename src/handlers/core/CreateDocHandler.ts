import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { CreateDocInput } from "../../tools/registry.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { docs_v1 } from "googleapis";

export class CreateDocHandler extends BaseToolHandler {
  async runTool(
    args: CreateDocInput,
    oauth2Client: OAuth2Client,
  ): Promise<CallToolResult> {
    const validArgs = args;
    const doc = await this.createDoc(oauth2Client, validArgs);
    return {
      content: [
        {
          type: "text", // This MUST be a string literal
          text: this.formatDocoutput(doc),
        },
      ],
    };
  }
  private async createDoc(
    client: OAuth2Client,
    args: CreateDocInput,
  ): Promise<docs_v1.Schema$Document> {
    try {
      const doc = this.getDocs(client);
      const response = await doc.documents.create({
        requestBody: {
          title: args.title,
        },
      });
      return response.data || [];
    } catch (error) {
      throw this.handleGoogleApiError(error);
    }
  }
  private formatDocoutput(document: docs_v1.Schema$Document): string {
    // const includePreview = opts?.includePreview ?? false;
    // const previewChars = opts?.previewChars ?? 200;

    const title = this.sanitizeString(document.title ?? "Untitled");
    const documentId = this.sanitizeString(document.documentId ?? "unknown-id");
    const line = `${title} (${documentId})`;

    return line;
  }

  /**
   * Sanitizes a string to prevent crashes by removing problematic characters
   */
  private sanitizeString(str: string, maxChars?: number): string {
    if (!str) return "";
    if (!maxChars) maxChars = 500;
    return (
      str
        // Remove null bytes and control characters that could cause crashes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Replace problematic Unicode characters
        .replace(/[\uFFFE\uFFFF]/g, "")
        // Limit length to prevent extremely long strings
        .substring(0, maxChars)
        // Trim whitespace
        .trim()
    );
  }
}
