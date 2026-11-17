// vite.config.js
import { defineConfig, defaultClientConditions } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()], // no optimizeDeps.loader, no esbuild.loader
  resolve: {
    // transformers.js points ONNX Runtime at its WebAssembly files on jsDelivr
    // (env.backends.onnx.wasm.wasmPaths), so the copy that onnxruntime-web's
    // default "bundle" build would add to dist/assets (over 20 MB) is never
    // requested. This export condition, defined by onnxruntime-web, selects
    // its build that leaves the .wasm and its loader out of the bundle.
    conditions: [...defaultClientConditions, "onnxruntime-web-use-extern-wasm"],
  },
});
