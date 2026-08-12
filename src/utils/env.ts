// True when running in a normal browser tab (no game client attached).
// FiveM's CEF runtime injects `invokeNative` on window; a plain browser never has it.
export const isEnvBrowser = (): boolean => !(window as any).invokeNative;
