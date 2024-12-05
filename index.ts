import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  downloadFigmaFile,
  getThumbnailsOfCanvases,
  parseKeyFromUrl,
  getThumbnails,
  readComments,
  postComment,
  replyToComment,
} from "./figma_api.js";

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

const VIEW_NODE: Tool = {
  name: "view_node",
  description: "Get a thumbnail for a specific node in a Figma file",
  inputSchema: {
    type: "object",
    properties: {
      file_key: {
        type: "string",
        description: "The key of the Figma file",
      },
      node_id: {
        type: "string",
        description: "The ID of the node to view",
      },
    },
    required: ["file_key", "node_id"],
  },
};

const READ_COMMENTS: Tool = {
  name: "read_comments",
  description: "Get all comments on a Figma file",
  inputSchema: {
    type: "object",
    properties: {
      file_key: {
        type: "string",
        description: "The key of the Figma file",
      },
    },
    required: ["file_key"],
  },
};

const POST_COMMENT: Tool = {
  name: "post_comment",
  description: "Post a comment on a node in a Figma file",
  inputSchema: {
    type: "object",
    properties: {
      file_key: {
        type: "string",
        description: "The key of the Figma file",
      },
      node_id: {
        type: "string",
        description: "The ID of the node to comment on",
      },
      message: {
        type: "string",
        description: "The comment message",
      },
      x: {
        type: "number",
        description: "The x coordinate of the comment pin",
      },
      y: {
        type: "number",
        description: "The y coordinate of the comment pin",
      },
    },
    required: ["file_key", "message", "x", "y"],
  },
};

const REPLY_TO_COMMENT: Tool = {
  name: "reply_to_comment",
  description: "Reply to an existing comment in a Figma file",
  inputSchema: {
    type: "object",
    properties: {
      file_key: {
        type: "string",
        description: "The key of the Figma file",
      },
      comment_id: {
        type: "string",
        description: "The ID of the comment to reply to",
      },
      message: {
        type: "string",
        description: "The reply message",
      },
    },
    required: ["file_key", "comment_id", "message"],
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [ADD_FIGMA_FILE, VIEW_NODE, READ_COMMENTS, POST_COMMENT, REPLY_TO_COMMENT],
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

async function doViewNode(fileKey: string, nodeId: string): Promise<CallToolResult> {
  const thumbnails = await getThumbnails(fileKey, [nodeId]);
  const nodeThumb = thumbnails[nodeId];
  if (!nodeThumb) {
    throw new Error(`Could not get thumbnail for node ${nodeId}`);
  }
  const b64 = await imageUrlToBase64(nodeThumb);
  return {
    content: [
      {
        type: "text",
        text: `Thumbnail for node ${nodeId}:`,
      },
      {
        type: "image",
        data: b64,
        mimeType: "image/png",
      },
    ],
  };
}

async function doReadComments(fileKey: string): Promise<CallToolResult> {
  const data = await readComments(fileKey);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function doPostComment(
  fileKey: string,
  message: string,
  x: number,
  y: number,
  nodeId?: string
): Promise<CallToolResult> {
  const data = await postComment(fileKey, message, x, y, nodeId);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function doReplyToComment(
  fileKey: string,
  commentId: string,
  message: string
): Promise<CallToolResult> {
  const data = await replyToComment(fileKey, commentId, message);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "add_figma_file") {
    console.error("Adding Figma file", request.params.arguments);
    const input = request.params.arguments as { url: string };
    return doAddFigmaFile(input.url);
  }

  if (request.params.name === "view_node") {
    const input = request.params.arguments as { file_key: string; node_id: string };
    return doViewNode(input.file_key, input.node_id);
  }

  if (request.params.name === "read_comments") {
    const input = request.params.arguments as { file_key: string };
    return doReadComments(input.file_key);
  }

  if (request.params.name === "post_comment") {
    const input = request.params.arguments as {
      file_key: string;
      node_id?: string;
      message: string;
      x: number;
      y: number;
    };
    return doPostComment(input.file_key, input.message, input.x, input.y, input.node_id);
  }

  if (request.params.name === "reply_to_comment") {
    const input = request.params.arguments as {
      file_key: string;
      comment_id: string;
      message: string;
    };
    return doReplyToComment(input.file_key, input.comment_id, input.message);
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

async function imageUrlToBase64(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}
