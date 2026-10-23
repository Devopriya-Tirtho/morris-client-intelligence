import { useEffect } from "react";
/** Focus containment for the prototype's drawers and confirmation panels. */
export function useDialogAccessibility() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    let previous: HTMLElement | null = null;
    const focusable = (dialog: HTMLElement) =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length > 0);
    const sync = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
      const next = dialogs.item(dialogs.length - 1);
      if (next === current) return;
      if (next) {
        previous = document.activeElement as HTMLElement;
        current = next;
        focusable(next)[0]?.focus();
      } else {
        current = null;
        previous?.focus();
        previous = null;
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();
    const key = (event: KeyboardEvent) => {
      if (!current) return;
      const items = focusable(current);
      if (event.key === "Escape") {
        event.preventDefault();
        const close = items.find(
          (el) =>
            el.getAttribute("aria-label") === "Close editor" ||
            el.textContent?.trim() === "Cancel",
        );
        close?.click();
      }
      if (event.key === "Tab" && items.length) {
        const first = items[0],
          last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !current.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !current.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", key);
    };
  }, []);
}
