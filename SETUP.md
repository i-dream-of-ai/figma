1. Download claude from https://claude.ai/download

2. 
```
echo "{
  \"mcpServers\": {
    \"filesystem\": {
      \"command\": \"npx\",
      \"args\": [
        \"-y\",
        \"@modelcontextprotocol/server-filesystem\",
        \"/Users/matt/code/figma-mcp\"
      ]
    }
  }
}
" > ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

3. See the hammer with number of tools.
