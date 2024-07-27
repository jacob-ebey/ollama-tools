import type { ChatResponse } from "ollama";

export interface ToolCallWithFunctionId {
  function: {
    id: string;
    name: string;
    arguments: {
      [key: string]: any;
    };
  };
}

export interface MessageWithToolCallWithFunctionId {
  role: string;
  content: string;
  images?: Uint8Array[] | string[];
  tool_calls?: ToolCallWithFunctionId[];
}

export interface ChatResponseWithToolCallWithFunctionId extends ChatResponse {
  message: MessageWithToolCallWithFunctionId;
}
