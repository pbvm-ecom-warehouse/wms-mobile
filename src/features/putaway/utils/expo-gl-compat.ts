export type ExpoGlPixelStoreContext = {
  UNPACK_FLIP_Y_WEBGL: number;
  pixelStorei: (parameter: number, value: number) => unknown;
};

const patchedContexts = new WeakSet<object>();

export function patchExpoGlPixelStore(gl: ExpoGlPixelStoreContext): void {
  if (patchedContexts.has(gl)) return;
  const pixelStorei = gl.pixelStorei.bind(gl);
  gl.pixelStorei = (parameter, value) => {
    if (parameter === gl.UNPACK_FLIP_Y_WEBGL) {
      return pixelStorei(parameter, value);
    }
    return undefined;
  };
  patchedContexts.add(gl);
}
