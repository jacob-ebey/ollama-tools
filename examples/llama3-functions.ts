import * as readline from "node:readline/promises";

import { Ollama, type Message } from "ollama";

import { iterableToStream, streamToIterable } from "#ollama-tools";
import {
  Llama3Functions,
  llama3FunctionsMessage,
  llama3FunctionResponse,
} from "#ollama-tools/llama3";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST,
});

const messages: Message[] = [
  llama3FunctionsMessage({
    current_weather: {
      description:
        "Get the current weather for a given location. Always summarize the results for the user.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description:
              "The city, town, state, country, you want to know the current weather for. It can be a partial query or a full query.",
          },
        },
        required: ["location"],
      },
    },
  }),
];

console.log("AI: Ask me about the weather.");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let skipPrompt = false;
while (true) {
  if (!skipPrompt) {
    let userPrompt = "";
    while (!userPrompt) {
      userPrompt = await rl.question("User: ");
    }
    messages.push({
      role: "user",
      content: userPrompt,
    });
  }
  skipPrompt = false;
  const stream = streamToIterable(
    iterableToStream(
      await ollama.chat({
        stream: true,
        model: "llama3.1",
        options: {
          temperature: 0,
        },
        messages,
      })
    ).pipeThrough(new Llama3Functions())
  );

  const functionCalls = [];
  process.stdout.write("AI: ");
  for await (const chunk of stream) {
    if (chunk.message.content) {
      process.stdout.write(chunk.message.content);
    }
    if (chunk.message.tool_calls?.length) {
      for (const toolCall of chunk.message.tool_calls) {
        if (!toolCall.function) continue;
        const shouldCallTool = (
          await rl.question(`Call Tool '${toolCall.function.name}'? (y/n): `)
        )
          .trim()
          .match(/^(y|yes)$/i);
        if (shouldCallTool) {
          functionCalls.push(toolCall.function);
        }
      }
    }
  }
  console.log();

  for (const functionCall of functionCalls) {
    switch (functionCall.name) {
      case "current_weather":
        const result = {
          temperature: (Math.random() * 10 + 25).toFixed(0),
          unit: "°F",
        };
        messages.push(...llama3FunctionResponse(functionCall, result));
        skipPrompt = true;
        break;
      default:
        throw new Error(`Unknown function call ${functionCall}`);
    }
  }
}
