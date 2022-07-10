import asyncHooks from 'async_hooks';

const { executionAsyncId } = asyncHooks;

// 保存异步调用的上下文。
const contexts: Map<string | number, any> = new Map();

const createHook = () => {
  contexts.clear();
  return asyncHooks
    .createHook({
      init: (asyncId, type, triggerId, resource) => {
        if (contexts.has(triggerId)) {
          contexts.set(asyncId, contexts.get(triggerId));
        }
      },
      // 在销毁对象后会触发 destroy 事件。
      destroy: (asyncId) => {
        if (!contexts.has(asyncId)) return;
        // 销毁当前异步上下文。
        contexts.delete(asyncId);
      },
    })
    .enable();
};

const hooks = createHook();

export function setupTraceId(traceId: string | number) {
  contexts.set(executionAsyncId(), traceId);
}

export function getTraceId() {
  return contexts.get(executionAsyncId());
}
