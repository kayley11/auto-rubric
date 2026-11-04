import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownToLine, X } from "lucide-react";
import { displayText } from "./presentation.mjs";

export function EvidenceDialog({ title, onClose, children, actions }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("button")?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const fields = [
        ...ref.current.querySelectorAll(
          'button, a[href], select, textarea, input, summary, [tabindex="0"]',
        ),
      ].filter((x) => !x.disabled && x.getClientRects().length);
      const first = fields[0],
        last = fields.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = scroll;
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="evidence-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="evidence-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={ref}
      >
        <header className="evidence-dialog-heading">
          <div>
            <h2 id={id}>{title}</h2>
            {actions}
          </div>
          <button
            className="icon-button"
            aria-label="Close evidence"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="evidence-dialog-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export function SavedDocument({ document, onClose }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(document.url, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("This saved material could not be loaded.");
        const text = await r.text();
        if (/^\s*<!doctype html/i.test(text))
          throw new Error("This file is not available at the saved address.");
        setText(displayText(text));
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [document.url]);
  return (
    <EvidenceDialog
      title={document.label}
      onClose={onClose}
      actions={
        <a className="text-button" href={document.url} download>
          <ArrowDownToLine size={14} /> Download a copy
        </a>
      }
    >
      {error ? (
        <p className="error-banner" role="alert">
          {error}
        </p>
      ) : text ? (
        <pre className="saved-output-text">{text}</pre>
      ) : (
        <p role="status">Loading saved material…</p>
      )}
    </EvidenceDialog>
  );
}
