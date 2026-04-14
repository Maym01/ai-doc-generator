import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// In-memory rate limiter: 5 requests per IP per 24 hours
// Resets on cold start — still blocks casual abuse and direct API callers
const RATE_LIMIT = 5
const WINDOW_MS = 24 * 60 * 60 * 1000
const ipTimestamps = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const timestamps = (ipTimestamps.get(ip) ?? []).filter(t => t > cutoff)
  if (timestamps.length >= RATE_LIMIT) return true
  timestamps.push(now)
  ipTimestamps.set(ip, timestamps)
  return false
}

const SYSTEM_PROMPTS: Record<string, string> = {
  jsdoc: `You are an expert technical writer. Given code, generate complete JSDoc comments.
Output ONLY the JSDoc comment block(s) — no explanation, no markdown fences, no extra text.
Use proper @param, @returns, @throws, @example tags. Be precise and helpful.`,

  tsdoc: `You are an expert TypeScript technical writer. Given code, generate complete TSDoc comments.
Output ONLY the TSDoc comment block(s) — no explanation, no markdown fences, no extra text.
Use proper @param, @returns, @throws, @example, @typeParam tags. Be precise and helpful.`,

  readme: `You are an expert technical writer. Given code, generate a clear README section for this function/module.
Output a well-formatted markdown README section with: description, usage example with code block, parameters table, and return value.
Output ONLY the markdown — no explanation or preamble.`,

  api: `You are an expert API documentation writer. Given code, generate an API reference block.
Output a clean markdown API reference with: endpoint or function name, description, request/parameters, response/return value, and example.
Output ONLY the markdown documentation — no explanation or preamble.`,
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'Free limit reached. Please upgrade to continue.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { code, docType } = await req.json()

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Code is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const systemPrompt = SYSTEM_PROMPTS[docType as string] ?? SYSTEM_PROMPTS.jsdoc

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate ${docType} documentation for this code:\n\n${code}`,
      },
    ],
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
