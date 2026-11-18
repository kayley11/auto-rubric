import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LockKeyhole, X } from "lucide-react";

export function requestSignIn(response) {
  if ([401, 403].includes(response.status))
    window.dispatchEvent(new Event("arena-sign-in"));
}

export function AccessControl({ access, onRefresh }) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false),
    [id, setId] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [checking, setChecking] = useState(false);
  useEffect(() => {
    const show = () => {
      if (access?.hosted && !access.authenticated) setOpen(true);
    };
    window.addEventListener("arena-sign-in", show);
    return () => window.removeEventListener("arena-sign-in", show);
  }, [access]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll("button, input");
      if (!elements?.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      previous?.focus();
    };
  }, [open]);
  if (!access?.hosted) return null;
  const connectionMessage = "The website cannot reach the evaluation server. Its backend or temporary tunnel may be reconnecting. Saved study results remain available.";
  async function checkConnection() {
    setChecking(true);
    try {
      const value = await onRefresh?.();
      setError(value?.access?.online ? "" : connectionMessage);
    } catch {
      setError(connectionMessage);
    } finally {
      setChecking(false);
    }
  }
  async function signIn(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/access/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      setPassword("");
      if (result.role === "reviewer") window.location.hash = "review";
      window.location.reload();
    } catch (e) {
      setError(/Evaluations are offline|host computer must be online/i.test(e.message) ? connectionMessage : e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    const response = await fetch("/api/access/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.ok) {
      localStorage.removeItem("autorubric-draft");
      sessionStorage.removeItem("autorubric-batch-v1");
      window.location.reload();
    }
  }
  return (
    <>
      <div className="access-control">
        <span>
          {access.online === false
            ? "Evaluation server unavailable"
            : access.authenticated
              ? "Workspace access"
              : "Public view"}
        </span>
        {access.online === false && <button className="secondary" disabled={checking} onClick={checkConnection}>{checking ? "Checking…" : "Check connection"}</button>}
        {access.authenticated && <a className="subtle-button" href="/#account">Account & API</a>}
        <button
          className="secondary"
          disabled={access.online === false}
          onClick={access.authenticated ? signOut : () => setOpen(true)}
        >
          <LockKeyhole size={14} />
          {access.authenticated ? "Sign out" : "Sign in"}
        </button>
      </div>
      {open &&
        createPortal(
          <div className="modal-backdrop">
            <section
              ref={dialogRef}
              className="modal access-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="access-title"
            >
              <div className="modal-heading">
                <h2 id="access-title">Workspace sign-in</h2>
                <button
                  className="icon-button"
                  aria-label="Close sign-in"
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={signIn} className="access-form">
                <p>
                  Saved cases are public. Sign in with your invited account to
                  generate answers, score cases and save reviews.
                </p>
                <p className="field-help">
                  Each clinician has an individual account. Reviewers can rate
                  saved answers without an API key. Evaluators can also run models;
                  administrators manage members and scoring rules.
                </p>
                <label className="field">
                  Account ID
                  <input
                    placeholder="Your invited account ID"
                    autoComplete="username"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    required
                    maxLength={40}
                  />
                </label>
                <label className="field">
                  Access password
                  <input
                    type="password"
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={256}
                  />
                </label>
                {error && (
                  <p className="error-banner" role="alert">
                    {error}
                  </p>
                )}
                {access.online === false && !error && <p className="error-banner" role="status">{connectionMessage}</p>}
                {access.online === false && <button type="button" className="secondary" disabled={checking} onClick={checkConnection}>{checking ? "Checking…" : "Check connection"}</button>}
                <button className="primary" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
