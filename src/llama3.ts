import type { ChatResponse } from "ollama";

import { SearchBuffer } from "./search-buffer.js";

interface ToolCallWithFunctionId {
  function: {
    id: string;
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
}

interface MessageWithToolCallWithFunctionId {
  role: string;
  content: string;
  images?: Uint8Array[] | string[];
  tool_calls?: ToolCallWithFunctionId[];
}

interface ChatResponseWithToolCallWithFunctionId extends ChatResponse {
  message: MessageWithToolCallWithFunctionId;
}

export class Llama3Functions extends TransformStream<
  ChatResponse,
  ChatResponseWithToolCallWithFunctionId
> {
  constructor() {
    const end = "</function>";
    const buffer = new SearchBuffer("<function=", end);

    super({
      transform(_chunk, controller) {
        const chunk = _chunk as ChatResponseWithToolCallWithFunctionId;

        const [content, functions] = buffer.push(chunk.message.content);

        chunk.message.content = content;
        chunk.message.tool_calls = chunk.message.tool_calls ?? [];

        for (const func of functions) {
          const name = func.slice(0, func.indexOf(">"));
          const args = func.slice(name.length + 1) || "{}";

          try {
            const parsedArgs = JSON.parse(args);
            chunk.message.tool_calls.push({
              function: {
                id: Math.random().toString(36).slice(-8),
                name,
                arguments: parsedArgs,
              },
            });
          } catch {}
        }

        controller.enqueue(chunk);
      },
      flush(controller) {
        const [content, functions] = buffer.finalize();

        const chunk: ChatResponseWithToolCallWithFunctionId = {
          created_at: new Date(),
          done: true,
          model: "",
          done_reason: "done",
          eval_count: 0,
          eval_duration: 0,
          load_duration: 0,
          prompt_eval_count: 0,
          prompt_eval_duration: 0,
          total_duration: 0,
          message: {
            role: "assistant",
            content,
          },
        };
        chunk.message.tool_calls = chunk.message.tool_calls ?? [];

        for (const func of functions) {
          const name = func.slice(0, func.indexOf(">"));
          const args = func.slice(name.length + 1, -end.length);
          try {
            const parsedArgs = JSON.parse(args);
            chunk.message.tool_calls.push({
              function: {
                id: Math.random().toString(36).slice(-8),
                name,
                arguments: parsedArgs,
              },
            });
          } catch {}
        }

        controller.enqueue(chunk);
      },
    });
  }
}

export function llama3FunctionsMessage(
  functions: Record<string, { description: string; parameters: unknown }>,
  additionalInstructions: string = ""
) {
  return {
    role: "user",
    content: `You have access to the following functions:

${Object.entries(functions)
  .map(
    ([name, { description, parameters }]) =>
      `Use the function '${name}' to '${description}':
${JSON.stringify({ name, description, parameters })}`
  )
  .join("\n\n")}

Think very carefully before calling functions.
If a you choose to call a function reply in the following format:

<function=example_function_name>{"example_name": "example_value"}</function>

Reminder:
- If looking for real time information use relevant functions before answering
- Function calls MUST follow the specified format, start with <function= and end with </function>
- Required parameters MUST be specified
- If not calling a function, continue the chat

${additionalInstructions ? `\n${additionalInstructions}` : ""}`.trim(),
  };
}

export function llama3FunctionResponse(
  functionCall: ToolCallWithFunctionId["function"],
  result: unknown
) {
  return [
    {
      role: "assistant",
      content: `<function=${functionCall.name}>${JSON.stringify(
        functionCall.arguments
      )}</function>`,
    },
    {
      role: "tool",
      content: `FUNCTION CALL: ${functionCall.id}
RESULT: ${JSON.stringify(result)}`,
    },
  ];
}
