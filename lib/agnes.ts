/**
 * Agnes AI client — calls local Python bridge by default on this machine,
 * because Node HTTPS to apihub.agnes-ai.com is hijacked (self-signed / HTML portal).
 *
 * Bridge: scripts/agnes_bridge.py  →  http://127.0.0.1:18787
 * Docs: https://www.agnes-ai.com/zh-Hans/docs/quickstart
 */

const AGNES_BASE = process.env.AGNES_BASE_URL || 'http://127.0.0.1:18787/v1';
const AGNES_MODEL = process.env.AGNES_MODEL || 'agnes-2.5-flash';

export function getAgnesConfig() {
  const apiKey = process.env.AGNES_API_KEY || process.env.AI_API_KEY || 'bridge';
  return {
    apiKey,
    baseUrl: AGNES_BASE.replace(/\/$/, ''),
    model: AGNES_MODEL,
  };
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function agnesFetch(body: Record<string, unknown>, stream: boolean) {
  const { apiKey, baseUrl, model } = getAgnesConfig();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      ...body,
      stream,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agnes API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

export async function agnesChat(
  messages: ChatMessage[],
  opts?: { temperature?: number; max_tokens?: number },
) {
  const res = await agnesFetch(
    {
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.max_tokens ?? 2048,
    },
    false,
  );
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data?.choices?.[0]?.message?.content || '';
}

export async function agnesChatStream(
  messages: ChatMessage[],
  opts?: { temperature?: number; max_tokens?: number },
) {
  const res = await agnesFetch(
    {
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.max_tokens ?? 2048,
    },
    true,
  );
  if (!res.body) throw new Error('Agnes 未返回流');
  return res.body;
}
