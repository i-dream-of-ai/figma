
## scaffolding
- ✅ run a local MCP
 -- npx @modelcontextprotocol/inspector npx figma-mcp
- ✅ what's the difference between 'resources' and 'tools'?
 -- RESOURCES are how you access data (eg local files like cached figma content). permission boundary so the user knows what they're giving access to.
 -- https://modelcontextprotocol.io/docs/concepts/resources
 -- TOOLS are the LLM actually call to manage the data
 -- PROMPTS are out of the box prompts. this seems like how you guide the user
 -- SAMPLING is a way for the server to ask the client to send a message to the LLM which may then call out to other MCP server. Not in Claude yet.
- how can I access the local file system to download figma resources?



## Product Ideas
- web app for explaining the features you expect, providing designs (eg figma links). provide a figjam link with user flows, provide links to other figma designs for details and screenshots. then other agents could connect to this
 -- "add file" api where the user can provide a file URL and we add it to the context
 -- "update file"
 -- "read file"
 -- "render thumbnail"
 -- bonus: "list project / team files"