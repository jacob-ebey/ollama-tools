export class SearchBuffer {
  private buffer: string = "";
  private startMarker: string;
  private endMarker: string;

  constructor(startMarker: string, endMarker: string) {
    this.startMarker = startMarker;
    this.endMarker = endMarker;
  }

  push(chunk: string): [string, string[]] {
    this.buffer += chunk;
    return this.processBuffer();
  }

  finalize(): [string, string[]] {
    return this.processBuffer(true);
  }

  private processBuffer(isFinalizing: boolean = false): [string, string[]] {
    const tags: string[] = [];
    let rest = "";

    while (true) {
      const startIndex = this.buffer.indexOf(this.startMarker);
      if (startIndex === -1) {
        if (isFinalizing) {
          rest += this.buffer;
          this.buffer = "";
        } else if (this.buffer.length >= this.startMarker.length) {
          rest += this.buffer.slice(
            0,
            this.buffer.length - this.startMarker.length + 1
          );
          this.buffer = this.buffer.slice(
            this.buffer.length - this.startMarker.length + 1
          );
        }
        break;
      }

      const endIndex = this.buffer.indexOf(
        this.endMarker,
        startIndex + this.startMarker.length
      );
      if (endIndex === -1) {
        if (isFinalizing) {
          rest += this.buffer;
          this.buffer = "";
        } else {
          rest += this.buffer.slice(0, startIndex);
          this.buffer = this.buffer.slice(startIndex);
        }
        break;
      }

      rest += this.buffer.slice(0, startIndex);
      tags.push(
        this.buffer.slice(startIndex + this.startMarker.length, endIndex)
      );
      this.buffer = this.buffer.slice(endIndex + this.endMarker.length);
    }

    return [rest, tags];
  }
}
