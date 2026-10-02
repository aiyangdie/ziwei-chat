import { NextRequest } from 'next/server';
import { agnesChatStream, type ChatMessage } from '@/lib/agnes';
import { summarizeChartForAI, ZIWEI_SYSTEM_PROMPT } from '@/lib/ziwei/chart-summary';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  chart?: ZiweiChart;
  messages?: { role: 'user' | 'assistant'; content: string }[];
};

/**
 * Streaming interpret API expected by ChatPanel / InsightPanel:
 *   data: {"delta":{"text":"..."}}\n\n
 *   data: [DONE]\n\n
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.chart) {
      return Response.json({ error: '缺少 chart' }, { status: 400 });
    }
    if (!body.messages?.length) {
      return Response.json({ error: '缺少 messages' }, { status: 400 });
    }

    const summary = summarizeChartForAI(body.chart);
    const upstream: ChatMessage[] = [
      {
        role: 'system',
        content: `${ZIWEI_SYSTEM_PROMPT}\n\n—— 命盘摘要 ——\n${summary}`,
      },
      ...body.messages
        .filter((m) => m.content?.trim())
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const upstreamBody = await agnesChatStream(upstream, { temperature: 0.7, max_tokens: 2048 });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamBody.getReader();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');
            buffer = parts.pop() || '';

            for (const raw of parts) {
              const line = raw.trim();
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload) continue;
              if (payload === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(payload);
                const text =
                  parsed?.choices?.[0]?.delta?.content ??
                  parsed?.choices?.[0]?.message?.content ??
                  '';
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`),
                  );
                }
              } catch {
                /* ignore partial JSON */
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : '流式解读失败';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: { text: `\n\n（错误：${msg}）` } })}\n\n`),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '服务器错误';
    return Response.json({ error: msg }, { status: 500 });
  }
}
