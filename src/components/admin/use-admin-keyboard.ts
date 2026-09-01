"use client";

import { useCallback, useEffect, useRef } from "react";

type KeyboardHandlers = {
  onNavigateDown?: () => void;
  onNavigateUp?: () => void;
  onApprove?: () => void;
  onQueueSms?: () => void;
  onRetryPublish?: () => void;
  onOpen?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
};

export function useAdminKeyboard(handlers: KeyboardHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!handlersRef.current.enabled) return;

    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    ) {
      return;
    }

    const h = handlersRef.current;

    switch (event.key) {
      case "j":
        event.preventDefault();
        h.onNavigateDown?.();
        break;
      case "k":
        event.preventDefault();
        h.onNavigateUp?.();
        break;
      case "a":
        h.onApprove?.();
        break;
      case "s":
        h.onQueueSms?.();
        break;
      case "r":
        h.onRetryPublish?.();
        break;
      case "Enter":
        h.onOpen?.();
        break;
      case "Escape":
        h.onEscape?.();
        break;
      case "[":
        h.onPrev?.();
        break;
      case "]":
        h.onNext?.();
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
