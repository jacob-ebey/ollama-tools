import { describe, test } from "node:test";
import * as assert from "node:assert/strict";

import type { ChatResponse } from "ollama";

import { Llama3Functions } from "./llama3.js";

function createOllamaStream(content: string): ReadableStream<ChatResponse> {
  return new ReadableStream({
    async start(controller) {
      for (const chunk of content) {
        await Promise.resolve();
        controller.enqueue({
          message: {
            content: chunk,
          },
        } as any);
      }
      controller.close();
    },
  });
}

describe("Llama3Functions", () => {
  test("can parse a function call from a stream", async () => {
    const reader = createOllamaStream(
      "Calling function <function=test>{}</function>"
    )
      .pipeThrough(new Llama3Functions())
      .getReader();

    let content = "";
    const functions = [];
    do {
      let { value, done } = await reader.read();
      if (value) {
        content += value.message.content;
        if (value.message.tool_calls?.length) {
          functions.push(
            ...value.message.tool_calls.map((toolCall) => toolCall.function)
          );
        }
      }
      if (done) break;
    } while (true);

    assert.equal(content, "Calling function ");
    for (const func of functions) {
      // @ts-expect-error
      delete func.id;
    }
    assert.deepEqual(functions, [
      {
        name: "test",
        arguments: {},
      },
    ]);
  });

  test("can parse multiple function calls from a stream", async () => {
    const reader = createOllamaStream(
      "Bla bla bla <function=test>{}</function> poo poo poo <function=test2>{}</function>"
    )
      .pipeThrough(new Llama3Functions())
      .getReader();

    let content = "";
    const functions = [];
    do {
      let { value, done } = await reader.read();
      if (value) {
        content += value.message.content;
        if (value.message.tool_calls?.length) {
          functions.push(
            ...value.message.tool_calls.map((toolCall) => toolCall.function)
          );
        }
      }
      if (done) break;
    } while (true);

    assert.equal(content, "Bla bla bla  poo poo poo ");
    for (const func of functions) {
      // @ts-expect-error
      delete func.id;
    }
    assert.deepEqual(functions, [
      {
        name: "test",
        arguments: {},
      },
      {
        name: "test2",
        arguments: {},
      },
    ]);
  });
});
