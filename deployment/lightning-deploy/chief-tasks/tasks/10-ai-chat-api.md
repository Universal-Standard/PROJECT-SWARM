# Task 10: AI Chat Completions API

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: API / AI
- **Phase**: Phase 1
- **Stream**: API Stream
- **Dependencies**: Task 09

## Objective
Create /api/chat endpoint with streaming support, multi-model routing (Claude/Groq/Gemini), and conversation history.

## Implementation
- Create src/app/api/chat/route.ts using Vercel AI SDK
- Implement model router: route by cost/speed/capability
- Support streaming responses via ReadableStream
- Store conversation history in Redis (Upstash)
- POST /api/chat — { messages, model, orgId }
- Implement token counting and cost tracking
- Rate limiting: 50 requests/hour per org on free plan

## Acceptance Criteria
- [ ] POST /api/chat returns streaming response
- [ ] All 3 AI providers work
- [ ] Conversation history persists
- [ ] Token usage logged to DB
- [ ] Rate limiting by org plan

## Deliverables
- `src/app/api/chat/route.ts`
- `src/lib/ai/router.ts`
- `src/lib/ai/providers/`
