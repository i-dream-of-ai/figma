import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { downloadFigmaFile, getThumbnailsOfCanvases, parseKeyFromUrl } from "./figma_api.js";

const server = new Server(
  {
    name: "figma-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      logging: {},
    },
  }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: `file://figma-mcp-files`,
      name: `Locally cached Figma files`,
      mimeType: "application/json",
      description: "A cache of Figma files you've already added to this machine.",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === `file://figma-mcp-files`) {
    const filesListPath = path.join(process.env.HOME!, ".figma-mcp", "files.json");
    if (!existsSync(filesListPath)) {
      return {
        contents: [],
      };
    }
    const files = readFileSync(filesListPath, "utf8");
    return {
      contents: [
        {
          uri: request.params.uri,
          text: files,
        },
      ],
    };
  }

  server.sendLoggingMessage({
    level: "info",
    data: "Got Figma files",
  });
  return {
    contents: [
      {
        uri: request.params.uri,
        text: "Got weather data",
      },
    ],
  };
});

const ADD_FIGMA_FILE: Tool = {
  name: "add_figma_file",
  description: "Add a Figma file to your context",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL of the Figma file to add",
      },
    },
    required: ["url"],
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [ADD_FIGMA_FILE],
}));

async function doAddFigmaFile(url: string): Promise<CallToolResult> {
  const key = parseKeyFromUrl(url);
  const figFileJson = await downloadFigmaFile(key);
  const thumbnails = await getThumbnailsOfCanvases(key, figFileJson.document);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          name: figFileJson.name,
          key,
          version: figFileJson.version,
        }),
      },
      {
        type: "text",
        text: "Here is the thumbnail of the Figma file",
      },
      {
        type: "image",
        data: figFileJson.thumbnailB64,
        mimeType: "image/png",
      },
      {
        type: "text",
        text: "Here is the JSON representation of the Figma file",
      },
      {
        type: "text",
        text: JSON.stringify(figFileJson.document),
      },
      {
        type: "text",
        text: "Here are thumbnails of the canvases in the Figma file",
      },
      ...thumbnails
        .map((thumbnail) => [
          {
            type: "text" as const,
            text: `Next is the image of canvas ID: ${thumbnail.id}`,
          },
          {
            type: "image" as const,
            data: thumbnail.b64,
            mimeType: "image/png",
          },
        ])
        .flat(),
    ],
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "add_figma_file") {
    console.error("Adding Figma file", request.params.arguments);
    const input = request.params.arguments as { url: string };
    return doAddFigmaFile(input.url);
  }

  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
});

server.onerror = (error) => {
  console.error(error);
};

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Figma MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
