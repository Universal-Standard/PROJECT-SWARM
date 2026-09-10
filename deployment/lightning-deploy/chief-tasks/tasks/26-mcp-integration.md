# Task 26: Model Context Protocol (MCP) Integration

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Core / Protocols
- **Phase**: Phase 2
- **Stream**: MCP Stream
- **Dependencies**: Tasks 01-08

## Objective
Integrate MCP (Model Context Protocol) to allow SWARM agents to use external tools, APIs, and data sources via standardized interfaces.

## Implementation
- Install @anthropic-ai/sdk with MCP support
- Create MCP server registry: register available tools
- Built-in MCP tools: web_search, file_read, code_execute, http_request
- Dynamic tool registration: add tools at runtime
- MCP tool result caching in Redis
- Tool call logging and cost attribution
- MCP server health monitoring

## Acceptance Criteria
- [ ] Agents can call MCP tools during execution
- [ ] Web search tool returns results
- [ ] File read/write tools work
- [ ] Tool results cached and reused

## Deliverables
- `src/lib/mcp/server.ts`
- `src/lib/mcp/tools/`
- `src/lib/mcp/registry.ts`
