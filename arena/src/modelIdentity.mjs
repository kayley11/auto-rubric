// KCL /api/v1/models, verified 2 November 2026. Keep deployment IDs unchanged.
export const kclModels = {
  "arc:lite": "Qwen3.8-27B",
  "arc:chat": "Qwen3.8-Flash-Next",
  "arc:apex": "GLM-5.3",
};
export function backendName(id, recorded) {
  const value = recorded || kclModels[id] || "";
  return value.replace(/^(?:Qwen|nvidia)\//, "");
}
export function modelOption(id) {
  const name = backendName(id);
  return name ? `${id} · ${name}` : id;
}
