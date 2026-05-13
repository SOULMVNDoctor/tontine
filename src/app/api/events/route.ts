import { onUpdate } from "@/lib/realtime";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (lines: string) => controller.enqueue(encoder.encode(lines));

      send(`event: connected\ndata: {}\n\n`);

      const unsubscribe = onUpdate((detail) => {
        send(`id: ${detail.id}\nevent: update\ndata: ${JSON.stringify(detail)}\n\n`);
      });

      const heartbeat = setInterval(() => {
        send(`event: ping\ndata: {}\n\n`);
      }, 15000);

      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      // no-op (cleanup is handled by start() return in most runtimes)
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
