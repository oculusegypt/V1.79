// Module-level voice pending store — shared between VoiceOrbOverlay and Zakiy page.
// More reliable than localStorage for in-session handoff because it survives
// the React Strict-Mode double-mount cycle: the cleanup cancels the clear timer,
// and the second mount reads the value again.

let _text = "";

export const voicePending = {
  set(text: string) {
    _text = text;
  },
  get(): string {
    return _text;
  },
  clear() {
    _text = "";
  },
};
