// Calculation/display state, independent of animation state (PLAN.md).
// Filled in on feature/core-math-engine.

export function createState() {
  return {
    expression: '',
    result: null,
    mode: 'idle', // 'idle' | 'result' | 'error'
  };
}
