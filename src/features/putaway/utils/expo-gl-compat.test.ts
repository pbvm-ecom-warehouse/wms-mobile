import { patchExpoGlPixelStore } from "./expo-gl-compat";

describe("Expo GL compatibility", () => {
  it("forwards flipY and ignores pixel-store parameters Expo GL does not support", () => {
    const pixelStorei = jest.fn();
    const gl = {
      UNPACK_FLIP_Y_WEBGL: 0x9240,
      pixelStorei,
    };

    patchExpoGlPixelStore(gl);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(0x0cf5, 4);

    expect(pixelStorei).toHaveBeenCalledTimes(1);
    expect(pixelStorei).toHaveBeenCalledWith(gl.UNPACK_FLIP_Y_WEBGL, 1);
  });

  it("patches each GL context only once", () => {
    const pixelStorei = jest.fn();
    const gl = {
      UNPACK_FLIP_Y_WEBGL: 0x9240,
      pixelStorei,
    };

    patchExpoGlPixelStore(gl);
    const patched = gl.pixelStorei;
    patchExpoGlPixelStore(gl);

    expect(gl.pixelStorei).toBe(patched);
  });
});
