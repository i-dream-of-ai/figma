import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListResourcesRequestSchema, ListToolsRequestSchema, McpError, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";


const server = new Server({
  name: "figma-mcp",
  version: "0.1.0",
}, {
  capabilities: {
    resources: {},
    tools: {},
    logging: {},
  }
});

server.setRequestHandler(
    ListResourcesRequestSchema,
    async () => ({
      resources: [{
        uri: `weather://berkeley/current`,
        name: `Current weather in Berkeley`,
        mimeType: "application/json",
        description: "Real-time weather data including temperature, conditions, humidity, and wind speed"
      }]
    })
  );

server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      const city = 'berkeley';
      if (request.params.uri !== `weather://${city}/current`) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown resource: ${request.params.uri}`
        );
      }

      server.sendLoggingMessage({
        level: "info",
        data: "Got weather data",
      });
      return {
        contents: [{
          uri: request.params.uri,
          text: "Got weather data",
        }]
      };
    }
  );

server.setRequestHandler(
  ListToolsRequestSchema,
  async () => ({
      tools: [{
        name: "get_forecast",
        description: "Get weather forecast for a city",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name"
            },
            days: {
              type: "number",
              description: "Number of days (1-5)",
              minimum: 1,
              maximum: 5
            }
          },
          required: ["city"]
        }
      }]
    })
  );
  
server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    if (request.params.name !== "get_forecast") {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
    }

    server.sendLoggingMessage({
      level: "info",
      data: "Called get_forecast tool",
    });
    return {
      contents: [{
        uri: request.params.uri,
        text: "get_forecast tool called",
      }]
    };
  }
);
  
server.onerror = (error) => {
  console.error(error);
};

process.on('SIGINT', async () => {
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