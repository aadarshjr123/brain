/**
 * A 2D context that records calls instead of drawing. Enough of the API for the renderer;
 * tests assert on call counts and arguments, never on pixels (system design §3.2).
 */
export interface Call {
  method: string;
  args: unknown[];
  /** Style state at the time of the call. */
  alpha: number;
  fill: unknown;
  stroke: unknown;
  font: string;
}

export function recordingCanvas() {
  const calls: Call[] = [];
  const state: Record<string, unknown> = {
    globalAlpha: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '10px sans',
  };
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({
        method,
        args,
        alpha: state.globalAlpha as number,
        fill: state.fillStyle,
        stroke: state.strokeStyle,
        font: state.font as string,
      });
      if (method === 'measureText') return { width: String(args[0]).length * 6 };
      if (method === 'createRadialGradient' || method === 'createLinearGradient')
        return { addColorStop: () => undefined };
      return undefined;
    };
  const ctx = new Proxy(state, {
    get: (target, key: string) => (key in target ? target[key] : record(key)),
    set: (target, key: string, value) => {
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;

  const canvas = { width: 0, height: 0, getContext: () => ctx };
  return {
    canvas,
    calls,
    count: (method: string) => calls.filter((c) => c.method === method).length,
    texts: () => calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0])),
    reset: () => {
      calls.length = 0;
    },
  };
}
