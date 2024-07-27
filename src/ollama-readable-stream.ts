import type { ChatResponse } from "ollama";

export function iterableToStream<T extends ChatResponse>(
  iterable: AsyncIterable<T>
): ReadableStream<T> {
  return new ReadableStream<T>({
    async start(controller) {
      for await (const response of iterable) {
        controller.enqueue(response);
      }
      controller.close();
    },
  });
}

export async function* streamToIterable<T extends ChatResponse>(
  stream: ReadableStream<T>
) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) yield value;
      if (done) break;
    }
  } finally {
    await reader.releaseLock();
  }
}
