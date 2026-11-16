/**
 * Incremental parser for newline-delimited JSON (the format Ollama streams).
 * Chunks may split a line anywhere; incomplete lines are buffered until the
 * next chunk arrives.
 */
export function createNdjsonParser<T = unknown>() {
  let buffer = '';

  function parseLines(lines: string[]): T[] {
    const out: T[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      out.push(JSON.parse(trimmed) as T);
    }
    return out;
  }

  return {
    /** Feed decoded text; returns every complete JSON object found so far. */
    push(chunk: string): T[] {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      return parseLines(lines);
    },
    /** Parse whatever is left once the stream has ended. */
    flush(): T[] {
      const rest = buffer;
      buffer = '';
      return parseLines([rest]);
    },
  };
}
