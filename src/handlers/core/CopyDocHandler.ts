import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { CopyDocInput } from "../../tools/registry.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { drive_v3 } from "googleapis";

export class CopyDocHandler extends BaseToolHandler {
  async runTool(
    args: CopyDocInput,
    oauth2Client: OAuth2Client,
  ): Promise<CallToolResult> {
    const validArgs = args;
    const drive = await this.copyDoc(oauth2Client, validArgs);

    return {
      content: [
        {
          type: "text", // This MUST be a string literal
          text: this.formatDocsList(drive),
        },
      ],
    };
  }
  private async copyDoc(
    client: OAuth2Client,
    args: CopyDocInput,
  ): Promise<drive_v3.Schema$File> {
    try {
      //     const copy_title = args.name
      // const body = {
      //     'name': copy_title
      // }

      const drive = this.getDrive(client);
      const response = await drive.files.copy(args);

      return response.data || [];
    } catch (error) {
      throw this.handleGoogleApiError(error);
    }
  }
  private formatDocsList(document: drive_v3.Schema$File): string {
    const id = document.id || " ";
    // const id = (document.id || " ");
    return id;
    // return (
    //   documents.files
    //     ?.map((doc) => {
    //       const name = this.sanitizeString(doc.name || "Untitled");
    //       // Sanitize strings to prevent crashes
    //       const id = this.sanitizeString(doc.id || "no-id");
    //       const createdTime = this.sanitizeString(doc.createdTime || "Unknown");
    //       const kind = this.sanitizeString(doc.kind || "Unknown");
    //       const fullFileExtension = this.sanitizeString(
    //         doc.fullFileExtension || "Unknown",
    //       );
    //       const version = this.sanitizeString(doc.version || "Unknown");
    //       const permissions = this.sanitizeString(
    //         doc.permissions?.forEach(
    //           (permission) => permission.permissionDetails,
    //         ) || "Unknown",
    //       );

    //       // Sanitize description and limit length
    //       let description = "";
    //       if (doc.description) {
    //         const sanitizedDesc = this.sanitizeString(doc.description);
    //         description =
    //           sanitizedDesc.length > 100
    //             ? `\n  Description: ${sanitizedDesc.substring(0, 100)}...`
    //             : `\n  Description: ${sanitizedDesc}`;
    //       }

    //       return `${name}$(${id})Kind: ${kind} Permissions: ${permissions} Full File Extension: ${fullFileExtension} version: ${version} Created Time: ${createdTime} Description: ${description}`;
    //     })
    //     .join("\n\n") || "No files found"
    // );
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
