import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { drive_v3 } from "googleapis";
import { ListDocsInput } from "../../tools/registry.js";

export class ListDocsHandler extends BaseToolHandler {
  async runTool(
    args: ListDocsInput,
    oauth2Client: OAuth2Client,
  ): Promise<CallToolResult> {
    const validArgs = args;
    const documents = await this.listDocs(oauth2Client, validArgs);
    return {
      content: [
        {
          type: "text", // This MUST be a string literal
          text: this.formatDocsList(documents),
        },
      ],
    };
    // async runTool(_: any, oauth2Client: OAuth2Client): Promise<CallToolResult> {
    //   const documents = await this.listDocs(oauth2Client);
    //   return {
    //     content: [
    //       {
    //         type: "text", // This MUST be a string literal
    //         text: this.formatDocsList(documents),
    //       },
    //     ],
    //   };
  }
  private async listDocs(
    client: OAuth2Client,
    query?: ListDocsInput,
  ): Promise<drive_v3.Schema$FileList> {
    try {
      let searchTerm = "";
      if (query?.searchTerm) {
        searchTerm = "and " + query.searchTerm;
      }
      const docs = this.getDrive(client);
      const response = await docs.files.list({
        // q: query?.query,
        q: `mimeType='application/vnd.google-apps.document'${searchTerm}`,
        fields: "files(id, name, createdTime, modifiedTime)",
        pageSize: 50,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: "allDrives",
      });
      // const response = await docs.files.list(query);
      return response.data || [];
    } catch (error) {
      throw this.handleGoogleApiError(error);
    }
  }

  private formatDocsList(documents: drive_v3.Schema$FileList): string {
    return (
      documents.files
        ?.map((doc) => {
          const name = this.sanitizeString(doc.name || "Untitled");
          // Sanitize strings to prevent crashes
          const id = this.sanitizeString(doc.id || "no-id");
          const createdTime = this.sanitizeString(doc.createdTime || "Unknown");
          const kind = this.sanitizeString(doc.kind || "Unknown");
          const fullFileExtension = this.sanitizeString(
            doc.fullFileExtension || "Unknown",
          );
          const version = this.sanitizeString(doc.version || "Unknown");
          const permissions = this.sanitizeString(
            doc.permissions?.forEach(
              (permission) => permission.permissionDetails,
            ) || "Unknown",
          );

          // Sanitize description and limit length
          let description = "";
          if (doc.description) {
            const sanitizedDesc = this.sanitizeString(doc.description);
            description =
              sanitizedDesc.length > 100
                ? `\n  Description: ${sanitizedDesc.substring(0, 100)}...`
                : `\n  Description: ${sanitizedDesc}`;
          }

          return `${name}$(${id})Kind: ${kind} Permissions: ${permissions} Full File Extension: ${fullFileExtension} version: ${version} Created Time: ${createdTime} Description: ${description}`;
        })
        .join("\n\n") || "No files found"
    );
  }
  /**
   * Sanitizes a string to prevent crashes by removing problematic characters
   */
  private sanitizeString(str: string): string {
    if (!str) return "";

    return (
      str
        // Remove null bytes and control characters that could cause crashes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Replace problematic Unicode characters
        .replace(/[\uFFFE\uFFFF]/g, "")
        // Limit length to prevent extremely long strings
        .substring(0, 500)
        // Trim whitespace
        .trim()
    );
  }
}
