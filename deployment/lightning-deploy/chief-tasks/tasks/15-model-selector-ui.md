# Task 15: AI Model Selector Component

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Frontend / Components
- **Phase**: Phase 1
- **Stream**: Frontend Stream
- **Dependencies**: Task 14

## Objective
Create a polished model selector component showing available AI models with capabilities, speed, and cost indicators.

## Implementation
- Create src/components/ModelSelector.tsx with dropdown/modal UI
- Display models: Claude Sonnet, Groq Llama 70B, Gemini Pro, etc.
- Show speed indicator (tokens/second), cost tier, and capability badges
- Persist selected model in localStorage + user preferences
- Show current availability status (green/yellow/red)
- Accessible: keyboard navigable, screen reader labels
- Responsive: works on mobile and desktop

## Acceptance Criteria
- [ ] Model selector renders all available models
- [ ] Selection persists across sessions
- [ ] Accessibility audit passes
- [ ] Mobile responsive

## Deliverables
- `src/components/ModelSelector.tsx`
- `src/lib/models/registry.ts`
