import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { BaseToolHandler } from "../handlers/core/BaseToolHandler.js";
import { ListDocsHandler } from "../handlers/core/ListDocsHandler.js";
import { GetDocHandler } from "../handlers/core/GetDocHandler.js";
import { CreateDocHandler } from "../handlers/core/CreateDocHandler.js";
import { UpdateDocHandler } from "../handlers/core/UpdateDocHandler.js";
// import { CopyDocHandler } from "../handlers/core/CopyDocHandler.js";
// import { ListTabsHandler } from "../handlers/core/ListTabsHandler.js";

export const ToolSchemas = {
  // Drive: list Google Docs (optionally by folder, with extra Drive query options)
  "list-docs": z.object({
    folderId: z
      .string()
      .optional()
      .describe(
        "Optional Drive folder ID to restrict results (filters to parents contains folderId).",
      ),
    query: z
      .string()
      .optional()
      .describe(
        "Additional Drive 'q' expression ANDed with the Docs mimeType and optional parent. Example: \"name contains 'Spec'\".",
      ),
    orderBy: z
      .string()
      .optional()
      .describe("Drive orderBy string, e.g., 'modifiedTime desc,name'."),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe("Max items per page (Drive default 100; max 1000)."),
    pageToken: z
      .string()
      .optional()
      .describe("Drive page token from a previous list."),
    spaces: z
      .string()
      .optional()
      .describe("Drive spaces to search (e.g., 'drive'). Defaults to 'drive'."),
  }),

  // Docs: fetch a document (optionally include all tabs’ content)
  "get-doc": z.object({
    docsArgs: z.object({
      documentId: z.string().describe("ID of the Google Doc to retrieve."),
      includeTabsContent: z
        .boolean()
        .optional()
        .describe(
          "If true, returns document.tabs with full tab content; top-level text fields (document.body, etc.) are left empty.",
        ),
      fields: z
        .string()
        .optional()
        .describe(
          "Optional partial-response selector, e.g., 'title,tabs.tabProperties,tabs.documentTab.body'.",
        ),
    }),
    formattingArgs: z
      .object({
        includePreview: z
          .boolean()
          .optional()
          .describe(
            "If true, returns preview of document; otherwise returns the full document.",
          ),
        previewChars: z
          .number()
          .int()
          .min(200)
          .optional()
          .describe("Max chars per document."),
      })
      .optional(),
  }),

  // Docs: create a new (blank) document with a title
  "create-doc": z.object({
    title: z.string().min(1).describe("Title for the new document."),
    // folderId: z.string().optional().describe(
    //   "Optional Drive folder ID to place the new doc into (performed via Drive after creation)."
    // )
  }),

  // "update-doc": z.object({
  //   title: z.string().min(1).describe("Title for the new document."),
  //   // folderId: z.string().optional().describe(
  //   //   "Optional Drive folder ID to place the new doc into (performed via Drive after creation)."
  //   // )
  // }),
  // "update-doc": z.object({
  //   documentId: z.string().min(1).describe("Google Docs documentId (same as Drive fileId) to update."),
  //   writeControl: z.object({
  //     requiredRevisionId: z.string().describe("If provided, the write will fail unless the doc is at this revision."),
  //   }).optional().describe("Optional optimistic concurrency control."),

  //   // ---- ONE of the following operation blocks ----

  //   insertText: z.object({
  //     location: z.object({
  //       index: z.number().int().min(1).describe("Docs insertion index (1 = after start marker)."),
  //     }).describe("Where to insert the text."),
  //     text: z.string().min(1).describe("Text to insert at the specified index."),
  //     paragraphStyle: z.object({
  //       namedStyleType: z.enum([
  //         "NORMAL_TEXT","TITLE","SUBTITLE",
  //         "HEADING_1","HEADING_2","HEADING_3","HEADING_4","HEADING_5","HEADING_6",
  //       ]).optional(),
  //       alignment: z.enum(["START","CENTER","END","JUSTIFIED"]).optional(),
  //       lineSpacing: z.number().optional(),
  //       spaceAbove: z.object({
  //         magnitude: z.number().describe("Points."),
  //         unit: z.literal("PT").default("PT"),
  //       }).optional(),
  //       spaceBelow: z.object({
  //         magnitude: z.number().describe("Points."),
  //         unit: z.literal("PT").default("PT"),
  //       }).optional(),
  //     }).optional().describe("Optional paragraph style applied to the inserted range."),
  //   }).optional().describe("Insert text into the body."),

  //   replaceAllText: z.object({
  //     containsText: z.object({
  //       text: z.string().min(1).describe("Find pattern (literal, not regex)."),
  //       matchCase: z.boolean().default(false).describe("Match case when true."),
  //     }).describe("Criteria for text replacement."),
  //     replaceText: z.string().default("").describe("Replacement text."),
  //   }).optional().describe("Replace all occurrences of matching text."),

  //   updateParagraphStyle: z.object({
  //     range: z.union([
  //       z.object({
  //         startIndex: z.number().int().min(1),
  //         endIndex: z.number().int().min(1),
  //         segmentId: z.string().optional(),
  //       }).describe("Half-open range [startIndex, endIndex)."),
  //       z.object({ entireDocument: z.literal(true) }).describe("Apply to entire document."),
  //     ]).describe("Target range for paragraph style update."),
  //     paragraphStyle: z.object({
  //       namedStyleType: z.enum([
  //         "NORMAL_TEXT","TITLE","SUBTITLE",
  //         "HEADING_1","HEADING_2","HEADING_3","HEADING_4","HEADING_5","HEADING_6",
  //       ]).optional(),
  //       alignment: z.enum(["START","CENTER","END","JUSTIFIED"]).optional(),
  //       lineSpacing: z.number().optional(),
  //       spaceAbove: z.object({ magnitude: z.number(), unit: z.literal("PT").default("PT") }).optional(),
  //       spaceBelow: z.object({ magnitude: z.number(), unit: z.literal("PT").default("PT") }).optional(),
  //     }).describe("ParagraphStyle to apply."),
  //     fields: z.string().min(1).describe("Comma-separated mask of fields to update, e.g. 'namedStyleType,alignment'."),
  //   }).optional().describe("Update paragraph-level styles in a range."),

  //   updateTextStyle: z.object({
  //     range: z.union([
  //       z.object({
  //         startIndex: z.number().int().min(1),
  //         endIndex: z.number().int().min(1),
  //         segmentId: z.string().optional(),
  //       }),
  //       z.object({ entireDocument: z.literal(true) }),
  //     ]).describe("Target range for text style update."),
  //     textStyle: z.object({
  //       bold: z.boolean().optional(),
  //       italic: z.boolean().optional(),
  //       underline: z.boolean().optional(),
  //       strikethrough: z.boolean().optional(),
  //       fontSize: z.object({ magnitude: z.number(), unit: z.literal("PT").default("PT") }).optional(),
  //       weightedFontFamily: z.object({ fontFamily: z.string(), weight: z.number().optional() }).optional(),
  //     }).describe("TextStyle fields to set in the range."),
  //     fields: z.string().min(1).describe("Comma-separated mask, e.g. 'bold,italic,weightedFontFamily,fontSize'."),
  //   }).optional().describe("Update character-level text styles in a range."),

  //   createParagraphBullets: z.object({
  //     range: z.union([
  //       z.object({ startIndex: z.number().int().min(1), endIndex: z.number().int().min(1), segmentId: z.string().optional() }),
  //       z.object({ entireDocument: z.literal(true) }),
  //     ]).describe("Range of paragraphs to convert to a list."),
  //     bulletPreset: z.enum([
  //       "BULLET_DISC_CIRCLE_SQUARE",
  //       "BULLET_DIAMOND_CIRCLE_SQUARE",
  //       "BULLET_CHECKBOX",
  //       "NUMBERED_DECIMAL_ALPHA_ROMAN",
  //       "NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS",
  //       "NUMBERED_DECIMAL_NESTED",
  //     ]).describe("Preset for bullet/numbering style."),
  //   }).optional().describe("Create bullets/numbering for paragraphs in a range."),

  //   deleteParagraphBullets: z.object({
  //     range: z.union([
  //       z.object({ startIndex: z.number().int().min(1), endIndex: z.number().int().min(1), segmentId: z.string().optional() }),
  //       z.object({ entireDocument: z.literal(true) }),
  //     ]).describe("Range of paragraphs to remove bullets from."),
  //   }).optional().describe("Remove bullets/numbering from paragraphs in a range."),

  //   deleteContentRange: z.object({
  //     range: z.union([
  //       z.object({ startIndex: z.number().int().min(1), endIndex: z.number().int().min(1), segmentId: z.string().optional() }),
  //       z.object({ entireDocument: z.literal(true) }),
  //     ]).describe("Content range to delete."),
  //   }).optional().describe("Delete content in the specified range."),
  // }).superRefine((val, ctx) => {
  //   const keys = [
  //     "insertText",
  //     "replaceAllText",
  //     "updateParagraphStyle",
  //     "updateTextStyle",
  //     "createParagraphBullets",
  //     "deleteParagraphBullets",
  //     "deleteContentRange",
  //   ] as const;
  //   const provided = keys.filter(k => (val as any)[k] !== undefined);
  //   if (provided.length !== 1) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: "Provide exactly one operation: insertText | replaceAllText | updateParagraphStyle | updateTextStyle | createParagraphBullets | deleteParagraphBullets | deleteContentRange.",
  //       path: [],
  //     });
  //   }
  // }),
  // Docs: batchUpdate (Params$Resource$Documents$Batchupdate-style)
  "update-doc": z.object({
    /** The ID of the document to update. */
    documentId: z
      .string()
      .min(1)
      .describe("The Google Docs documentId to update."),

    /** Request body metadata (Schema$BatchUpdateDocumentRequest) */
    requestBody: z.object({
      writeControl: z
        .object({
          requiredRevisionId: z
            .string()
            .describe(
              "If provided, the write will fail unless the doc is at this revision.",
            ),
        })
        .optional()
        .describe("Optional optimistic concurrency control."),

      // One or more Docs requests; each item must specify exactly ONE operation.
      requests: z
        .array(
          z
            .object({
              // ---- insertText ----
              insertText: z
                .object({
                  location: z
                    .object({
                      index: z
                        .number()
                        .int()
                        .min(1)
                        .describe(
                          "Docs insertion index (1 = after start marker).",
                        ),
                    })
                    .describe("Where to insert the text."),
                  text: z
                    .string()
                    .min(1)
                    .describe("Text to insert at the specified index."),
                })
                .optional()
                .describe("Insert text into the body."),

              // ---- replaceAllText ----
              replaceAllText: z
                .object({
                  containsText: z
                    .object({
                      text: z
                        .string()
                        .min(1)
                        .describe("Find pattern (literal, not regex)."),
                      matchCase: z
                        .boolean()
                        .default(false)
                        .describe("Match case when true."),
                    })
                    .describe("Criteria for text replacement."),
                  replaceText: z
                    .string()
                    .default("")
                    .describe("Replacement text."),
                })
                .optional()
                .describe("Replace all occurrences of matching text."),

              // ---- updateParagraphStyle ----
              updateParagraphStyle: z
                .object({
                  range: z
                    .object({
                      startIndex: z.number().int().min(1),
                      endIndex: z.number().int().min(1),
                      segmentId: z.string().optional(),
                    })
                    .describe("Half-open range [startIndex, endIndex)."),
                  paragraphStyle: z
                    .object({
                      namedStyleType: z
                        .enum([
                          "NORMAL_TEXT",
                          "TITLE",
                          "SUBTITLE",
                          "HEADING_1",
                          "HEADING_2",
                          "HEADING_3",
                          "HEADING_4",
                          "HEADING_5",
                          "HEADING_6",
                        ])
                        .optional(),
                      alignment: z
                        .enum(["START", "CENTER", "END", "JUSTIFIED"])
                        .optional(),
                      lineSpacing: z.number().optional(),
                      spaceAbove: z
                        .object({
                          magnitude: z.number().describe("Points."),
                          unit: z.literal("PT").default("PT"),
                        })
                        .optional(),
                      spaceBelow: z
                        .object({
                          magnitude: z.number().describe("Points."),
                          unit: z.literal("PT").default("PT"),
                        })
                        .optional(),
                    })
                    .describe("ParagraphStyle to apply."),
                  fields: z
                    .string()
                    .min(1)
                    .describe(
                      "Comma-separated mask of fields to update, e.g. 'namedStyleType,alignment'.",
                    ),
                })
                .optional()
                .describe("Update paragraph-level styles in a range."),

              // ---- updateTextStyle ----
              updateTextStyle: z
                .object({
                  range: z
                    .object({
                      startIndex: z.number().int().min(1),
                      endIndex: z.number().int().min(1),
                      segmentId: z.string().optional(),
                    })
                    .describe("Target character range for text style update."),
                  textStyle: z
                    .object({
                      bold: z.boolean().optional(),
                      italic: z.boolean().optional(),
                      underline: z.boolean().optional(),
                      strikethrough: z.boolean().optional(),
                      fontSize: z
                        .object({
                          magnitude: z.number(),
                          unit: z.literal("PT").default("PT"),
                        })
                        .optional(),
                      weightedFontFamily: z
                        .object({
                          fontFamily: z.string(),
                          weight: z.number().optional(),
                        })
                        .optional(),
                    })
                    .describe("TextStyle fields to set in the range."),
                  fields: z
                    .string()
                    .min(1)
                    .describe(
                      "Comma-separated mask, e.g. 'bold,italic,weightedFontFamily,fontSize'.",
                    ),
                })
                .optional()
                .describe("Update character-level text styles in a range."),

              // ---- createParagraphBullets ----
              createParagraphBullets: z
                .object({
                  range: z
                    .object({
                      startIndex: z.number().int().min(1),
                      endIndex: z.number().int().min(1),
                      segmentId: z.string().optional(),
                    })
                    .describe("Range of paragraphs to convert to a list."),
                  bulletPreset: z
                    .enum([
                      "BULLET_DISC_CIRCLE_SQUARE",
                      "BULLET_DIAMOND_CIRCLE_SQUARE",
                      "BULLET_CHECKBOX",
                      "NUMBERED_DECIMAL_ALPHA_ROMAN",
                      "NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS",
                      "NUMBERED_DECIMAL_NESTED",
                    ])
                    .describe("Preset for bullet/numbering style."),
                })
                .optional()
                .describe(
                  "Create bullets/numbering for paragraphs in a range.",
                ),

              // ---- deleteParagraphBullets ----
              deleteParagraphBullets: z
                .object({
                  range: z
                    .object({
                      startIndex: z.number().int().min(1),
                      endIndex: z.number().int().min(1),
                      segmentId: z.string().optional(),
                    })
                    .describe("Range of paragraphs to remove bullets from."),
                })
                .optional()
                .describe(
                  "Remove bullets/numbering from paragraphs in a range.",
                ),

              // ---- deleteContentRange ----
              deleteContentRange: z
                .object({
                  range: z
                    .object({
                      startIndex: z.number().int().min(1),
                      endIndex: z.number().int().min(1),
                      segmentId: z.string().optional(),
                    })
                    .describe("Content range to delete."),
                })
                .optional()
                .describe("Delete content in the specified range."),
            })
            .superRefine((req, ctx) => {
              const keys = [
                "insertText",
                "replaceAllText",
                "updateParagraphStyle",
                "updateTextStyle",
                "createParagraphBullets",
                "deleteParagraphBullets",
                "deleteContentRange",
              ] as const;
              const provided = keys.filter(
                (k) => (req as any)[k] !== undefined,
              );
              if (provided.length !== 1) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Each request must include exactly one operation.",
                  path: [],
                });
              }
            }),
        )
        .min(1)
        .describe(
          "One or more Docs requests; each object must specify exactly one operation.",
        ),
    }),
  }),

  // Drive: copy an existing Doc (new file gets a new ID)
  "copy-doc": z.object({
    fileId: z.string().describe("Drive file ID of the source Doc to copy."),
    name: z
      .string()
      .optional()
      .describe("Optional new name for the copied Doc."),
    parents: z
      .array(z.string())
      .optional()
      .describe("Optional array of Drive folder IDs to place the copy in."),
    keepRevisionForever: z
      .boolean()
      .optional()
      .describe(
        "Whether to keep a persistent, immutable copy of the revision (Drive setting).",
      ),
  }),

  // Helper: return tab metadata (IDs, titles, hierarchy) without full content
  "list-tabs": z.object({
    documentId: z.string().describe("ID of the Google Doc."),
    includeChildTabs: z
      .boolean()
      .optional()
      .describe(
        "If true, traverse and flatten child tabs for convenience (client-side traversal of document.tabs[].childTabs).",
      ),
  }),
} as const;

// Export individual types for convenience
export type ToolInputs = {
  [K in keyof typeof ToolSchemas]: z.infer<(typeof ToolSchemas)[K]>;
};

export type ListDocsInput = ToolInputs["list-docs"];
export type GetDocInput = ToolInputs["get-doc"];
export type CreateDocInput = ToolInputs["create-doc"];
export type UpdateDocInput = ToolInputs["update-doc"];
export type CopyDocInput = ToolInputs["copy-doc"];
export type ListTabsInput = ToolInputs["list-tabs"];

interface ToolDefinition {
  name: keyof typeof ToolSchemas;
  description: string;
  schema: z.ZodType<any>;
  handler: new () => BaseToolHandler;
  handlerFunction?: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private static extractSchemaShape(schema: z.ZodType<any>): any {
    const schemaAny = schema as any;

    // Handle ZodEffects (schemas with .refine())
    if (schemaAny._def && schemaAny._def.typeName === "ZodEffects") {
      return this.extractSchemaShape(schemaAny._def.schema);
    }

    // Handle regular ZodObject
    if ("shape" in schemaAny) {
      return schemaAny.shape;
    }

    // Handle other nested structures
    if (schemaAny._def && schemaAny._def.schema) {
      return this.extractSchemaShape(schemaAny._def.schema);
    }

    // Fallback to the original approach
    return schemaAny._def?.schema?.shape || schemaAny.shape;
  }
  private static tools: ToolDefinition[] = [
    {
      name: "list-docs",
      description:
        "List Google Docs from Drive. Can filter by folder ID and additional Drive query parameters.",
      schema: ToolSchemas["list-docs"],
      handler: ListDocsHandler,
    },
    {
      name: "get-doc",
      description:
        "Retrieve a Google Doc's metadata and/or content. Supports fetching tab content.",
      schema: ToolSchemas["get-doc"],
      handler: GetDocHandler,
    },
    {
      name: "create-doc",
      description:
        "Create a new blank Google Doc with a given title. Optionally place it in a Drive folder.",
      schema: ToolSchemas["create-doc"],
      handler: CreateDocHandler,
    },
    {
      name: "update-doc",
      description:
        "Create a new blank Google Doc with a given title. Optionally place it in a Drive folder.",
      schema: ToolSchemas["update-doc"],
      handler: UpdateDocHandler,
    },
    // {
    //   name: "copy-doc",
    //   description: "Copy an existing Google Doc to a new file. Optionally rename and/or place in specific folders.",
    //   schema: ToolSchemas["copy-doc"],
    //   handler: CopyDocHandler
    // },
    // {
    //   name: "list-tabs",
    //   description: "List all tabs in a Google Doc, returning tab IDs, titles, and optional child tabs.",
    //   schema: ToolSchemas["list-tabs"],
    //   handler: ListTabsHandler
    // }
  ];

  static getToolsWithSchemas() {
    return this.tools.map((tool) => {
      const jsonSchema = zodToJsonSchema(tool.schema);
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: jsonSchema,
      };
    });
  }
  static async registerAll(
    server: McpServer,
    executeWithHandler: (
      handler: any,
      args: any,
    ) => Promise<{ content: Array<{ type: "text"; text: string }> }>,
  ) {
    for (const tool of this.tools) {
      // Use the existing registerTool method which handles schema conversion properly
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: this.extractSchemaShape(tool.schema),
        },
        async (args: any) => {
          // Validate input using our Zod schema
          const validatedArgs = tool.schema.parse(args);

          // Apply any custom handler function preprocessing
          const processedArgs = tool.handlerFunction
            ? await tool.handlerFunction(validatedArgs)
            : validatedArgs;

          // Create handler instance and execute
          const handler = new tool.handler();
          return executeWithHandler(handler, processedArgs);
        },
      );
    }
  }
}
