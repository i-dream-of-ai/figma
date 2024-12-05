
## scaffolding
- ✅ run a local MCP
 -- npx @modelcontextprotocol/inspector npx figma-mcp
- ✅ what's the difference between 'resources' and 'tools'?
 -- RESOURCES are how you access data (eg local files like cached figma content). permission boundary so the user knows what they're giving access to.
 -- https://modelcontextprotocol.io/docs/concepts/resources
 -- TOOLS are the LLM actually call to manage the data
 -- PROMPTS are out of the box prompts. this seems like how you guide the user
 -- SAMPLING is a way for the server to ask the client to send a message to the LLM which may then call out to other MCP server. Not in Claude yet.
- ✅ how can I access the local file system to download figma resources?
 -- not gonna worry about caching. the context will stay in the thread so Claude can handle that.

Tools:
- ✅ add_figma_file() - Get JSON + page thumbnails in context
- [] view_node(node_id) - Get a thumbnail for a specific node
- [] read_comments() - Get all comments on a file
- [] post_comment(node_id, position, text) - Post a comment on a node or reply
- reply_to_comment(comment_id, text)

Docs:
- [] how to setup
- [] demo using this + file + Claude to write out JSX
- [] demo using this to brainstorm with claude after a reflection

Tools to skip:
- read_activity_logs - This would allow admins to explore data more easily. Claude doesn't have code interpreter tho :/
- webhooks - better handled programmatically 
- devresource - this could be really cool for having Claude manage your Jira + Figma
- components & styles & analytics - Maybe this would be nice?

