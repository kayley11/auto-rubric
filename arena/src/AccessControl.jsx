import { useEffect, useRef, useState } from "react";
import { LockKeyhole, X } from "lucide-react";

export function requestSignIn(response) {
  if ([401, 403].includes(response.status))
    window.dispatchEvent(new Event("arena-sign-in"));
}

export function AccessControl({ access }) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false),
    [id, setId] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
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
      window.location.reload();
    } catch (e) {
      setError(e.message);
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
      window.location.reload();
    }
  }
  return (
    <>
      <div className="access-control">
        <span>
          {access.online === false
            ? "Evaluations offline"
            : access.authenticated
              ? "Member access"
              : "Public view"}
        </span>
        <button
          className="secondary"
          disabled={access.online === false}
          onClick={access.authenticated ? signOut : () => setOpen(true)}
        >
          <LockKeyhole size={14} />
          {access.authenticated ? "Sign out" : "Sign in"}
        </button>
      </div>
      {open && (
        <div className="modal-backdrop">
          <section
            ref={dialogRef}
            className="modal access-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-title"
          >
            <div className="modal-heading">
              <h2 id="access-title">Member sign-in</h2>
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
                Browsing the saved study is public. Generating, scoring and
                saving reviews require an authorised account. New evaluations
                are private to that account.
              </p>
              <label className="field">
                Account ID
                <input
                  autoFocus
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
              <button className="primary" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
