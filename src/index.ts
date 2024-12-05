import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types";
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types";

const server = new Server({
  name: "figma-mcp",
  version: "0.1.0",
}, {
  capabilities: {
    resources: {}
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///example.txt",
        name: "Example Resource",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "file:///example.txt") {
    return {
      contents: [
        {
          uri: "file:///example.txt",
          mimeType: "text/plain",
          text: "This is the content of the example resource.",
        },
      ],
    };
  } else {
    throw new Error("Resource not found");
  }
});

const transport = new StdioServerTransport();

async function main() {
    await server.connect(transport);
}

main().catch(console.error);