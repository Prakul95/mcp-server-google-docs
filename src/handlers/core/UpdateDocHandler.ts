import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { OAuth2Client } from "google-auth-library";
import { UpdateDocInput } from "../../tools/registry.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { docs_v1 } from "googleapis";

export class UpdateDocHandler extends BaseToolHandler {
    async runTool(args: UpdateDocInput , oauth2Client: OAuth2Client): Promise<CallToolResult> {
        const validArgs = args as UpdateDocInput;
        const doc =  await this.updateDoc(oauth2Client, validArgs);
        return {
            content: [{
                type: "text", // This MUST be a string literal
                text: this.formatDocsList(doc),
            }],
        };
    }
    private async updateDoc(client: OAuth2Client, args:UpdateDocInput ): Promise<docs_v1.Schema$Document> {
        try {
            const doc = this.getDocs(client);
            const response = await doc.documents.batchUpdate(args)
            return response.data || [];
        } catch (error) {
            throw this.handleGoogleApiError(error);
        }
    }
    private formatDocSummary(document: docs_v1.Schema$Document,opts?: { includePreview?: boolean; previewChars?: number }): string {
        const includePreview = opts?.includePreview ?? false;
        const previewChars = opts?.previewChars ?? 200;
        const tabs = document.tabs ?? []
        const title = this.sanitizeString(document.title ?? "Untitled");
        const documentId = this.sanitizeString(document.documentId ?? "unknown-id");
        const revisionId = this.sanitizeString(document.revisionId ?? "unknown-revision");
        // const tabId = document.tabs ?? ""
        // for (const element of tabs){
        //   element.childTabs
        //   element.tabProperties
        //   element.documentTab.
        // };
        const counts = this.countDocElements(document);
        const hasHeaders = !!document.headers && Object.keys(document.headers).length > 0;
        const hasFooters = !!document.footers && Object.keys(document.footers).length > 0;

        let line = `${title} (${documentId})  rev:${revisionId}  ` +
            `Paragraphs:${counts.paragraphs}  Tables:${counts.tables}  Images:${counts.images}` +
            `  Headers:${hasHeaders ? "yes" : "no"}  Footers:${hasFooters ? "yes" : "no"}`;

        if (includePreview) {
            // Extract limited preview (with user-specified or default chars)
            const preview = this.extractTextPreview(document, previewChars);
            if (preview) {
                line += `\n  Preview: ${preview}`;
                }
            } 
        else {
            // Extract full document text
            const fullText = this.extractTextPreview(document, Number.MAX_SAFE_INTEGER);
            if (fullText) {
            line += `\n  Full Text: ${fullText}`;
            }
        }

        return line;
    }

    private countDocElements(document: docs_v1.Schema$Document): { paragraphs: number; tables: number; images: number } {
  const body = document.body?.content ?? [];
  let paragraphs = 0;
  let tables = 0;

  for (const el of body) {
    if (el.paragraph) paragraphs++;
    if (el.table) tables++;
  }

  // Images are represented as inlineObjects referenced from paragraph elements.
  const images = Object.keys(document.inlineObjects ?? {}).length;

  return { paragraphs, tables, images };
}

/**
 * Extract a plain-text preview from the document body (best-effort).
 */
private extractTextPreview(document: docs_v1.Schema$Document, maxChars: number): string {
  const pieces: string[] = [];
  const content = document.body?.content ?? [];

  for (const el of content) {
    if (!el.paragraph?.elements) continue;

    for (const pe of el.paragraph.elements) {
      const txt = pe.textRun?.content;
      if (txt) pieces.push(txt);
      if (pieces.join("").length >= maxChars) break;
    }
    if (pieces.join("").length >= maxChars) break;
  }

  const joined = pieces.join("").replace(/\s+/g, " ").trim();
  const sanitized = this.sanitizeString(joined, maxChars)

  return sanitized;
}

/**
 * If you actually want a "list" formatter (array of Schema$Document),
 * use this convenience wrapper.
 */
private formatDocsList(document: docs_v1.Schema$Document): string {
  if (!document) return "No documents found";
  return this.formatDocSummary(document);
}
/**
     * Sanitizes a string to prevent crashes by removing problematic characters
     */
    private sanitizeString(str: string, maxChars?: number ): string {
        if (!str) return "";
        if (!maxChars) maxChars = 500;
        return str
            // Remove null bytes and control characters that could cause crashes
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Replace problematic Unicode characters
            .replace(/[\uFFFE\uFFFF]/g, '')
            // Limit length to prevent extremely long strings
            .substring(0, maxChars)
            // Trim whitespace
            .trim();
    }
}