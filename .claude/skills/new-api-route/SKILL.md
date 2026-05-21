---
name: new-api-route
description: Scaffold a new streaming Anthropic API route in src/app/api/
---
Create a new Next.js App Router API route at src/app/api/<name>/route.ts.
Follow the exact pattern of src/app/api/generate/route.ts:
- POST handler, parse {prompt, system} from body
- Use @anthropic-ai/sdk streaming with claude-sonnet-4-6
- Apply cache_control ephemeral on system prompt
- Return ReadableStream with text/plain headers
