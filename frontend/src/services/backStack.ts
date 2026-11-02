/**
 * Screens that can "go back" by themselves (an open menu, the create-account form...)
 * register a handler here. The phone's back button / gesture asks them in turn, newest first.
 * A handler returns true when it used the back press.
 */
const handlers: Array<() => boolean> = [];

export const registerBackHandler = (fn: () => boolean): (() => void) => {
  handlers.push(fn);
  return () => {
    const i = handlers.lastIndexOf(fn);
    if (i >= 0) handlers.splice(i, 1);
  };
};

export const runBackHandlers = (): boolean => {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true;
  }
  return false;
};
