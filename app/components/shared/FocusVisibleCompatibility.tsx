"use client";

import { useEffect } from "react";

export default function FocusVisibleCompatibility() {
  useEffect(() => {
    const prototype = Element.prototype;
    const nativeMatches = prototype.matches;

    try {
      document.documentElement.matches(":focus-visible");
      return;
    } catch {
      // Install a keyboard-focus fallback only when the native selector fails.
    }

    let keyboardFocus = true;
    const useKeyboardFocus = () => {
      keyboardFocus = true;
    };
    const usePointerFocus = () => {
      keyboardFocus = false;
    };

    document.addEventListener("keydown", useKeyboardFocus, true);
    document.addEventListener("mousedown", usePointerFocus, true);
    document.addEventListener("pointerdown", usePointerFocus, true);
    document.addEventListener("touchstart", usePointerFocus, true);

    prototype.matches = function matches(selector: string) {
      if (selector === ":focus-visible") {
        return keyboardFocus && this === document.activeElement;
      }
      return nativeMatches.call(this, selector);
    };

    return () => {
      prototype.matches = nativeMatches;
      document.removeEventListener("keydown", useKeyboardFocus, true);
      document.removeEventListener("mousedown", usePointerFocus, true);
      document.removeEventListener("pointerdown", usePointerFocus, true);
      document.removeEventListener("touchstart", usePointerFocus, true);
    };
  }, []);

  return null;
}
