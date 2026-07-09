import { z } from 'zod';

const NIM_API_KEY = process.env.NIM_API_KEY || process.env.NVIDIA_NIM_API_KEY || '';
const NIM_BASE_URL = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

const NIM_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';

interface NimChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NimChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function nimChat(
  messages: NimChatMessage[],
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  if (!NIM_API_KEY) {
    throw new Error('NIM_API_KEY not configured');
  }

  const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NIM API error ${response.status}: ${errText}`);
  }

  const data: NimChatResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

export async function nimJsonChat<T>(
  messages: NimChatMessage[],
  schema: z.ZodSchema<T>,
  options: { temperature?: number; max_tokens?: number } = {}
): Promise<{ result: T; raw: string }> {
  const raw = await nimChat(messages, options);

  // Try to extract JSON from the response
  let jsonStr = raw;
  const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // Try to find JSON object or array
    const firstBrace = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');
    if (firstBrace === -1 && firstBracket === -1) {
      throw new Error('No JSON found in NIM response');
    }
    if (firstBrace >= 0 && (firstBracket === -1 || firstBrace < firstBracket)) {
      jsonStr = jsonStr.substring(firstBrace);
    } else if (firstBracket >= 0) {
      jsonStr = jsonStr.substring(firstBracket);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const result = schema.parse(parsed);
    return { result, raw };
  } catch (e) {
    throw new Error(`Failed to parse NIM response as JSON: ${(e as Error).message}\nRaw: ${raw}`);
  }
}
