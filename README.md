# ollama-tools

Tools to help you supercharge your Ollama usage.

## Installation

```sh
pnpm i -E ollama-tools
```

## Tools

### `ollama-tools`

#### `iterableToStream`

Convert an iterable into a ReadableStream.

#### `streamToIterable`

Convert a ReadableStream to an iterable.

#### `SearchBuffer`

A buffer that can be used to search for content between two markers.

```ts
const buffer = new SearchBuffer("<start>", "</end>");
let [rest, found] = buffer.push(
  "before<start>Hello</end>between<start>World</end>after"
);
assert.equal(rest, "beforebetween");
assert.deepEqual(found, ["Hello", "World"]);

[rest, found] = buffer.finalize();
assert.equal(rest, "after");
assert.deepEqual(found, []);
```

### `ollama-tools/llama3`

For an example of how to use the llama3 API's see [examples/llama3-functions.ts](./examples/llama3-functions.ts).

#### `llama3FunctionsMessage`

Create a Message that contains a llama3 functions prompt to enable function invocations in responses.

#### `llama3FunctionResponse`

Create Messages that represent a llama3 function call and it's response.

#### `Llama3Functions`

A transform stream to parse llama3 function invocation syntax into tool calls.
