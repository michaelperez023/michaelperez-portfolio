import { useState } from "react";
import { FiMail, FiCheck } from "react-icons/fi";
import { information } from "../data/content";

// Copies the email to the clipboard with brief "Copied!" feedback.
// Falls back to a textarea+execCommand path, then to mailto, if the
// async Clipboard API is unavailable (e.g. non-secure context).
export default function CopyEmail({ variant = "button" }) {
  const [copied, setCopied] = useState(false);
  const email = information.email;
  if (!email) return null;

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
      } else {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  const label = copied ? "Email address copied" : `Copy email address ${email}`;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={copy}
        className={copied ? "is-copied" : undefined}
        aria-label={label}
        title={email}
      >
        {copied ? <FiCheck size={19} /> : <FiMail size={19} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn btn-ghost${copied ? " is-copied" : ""}`}
      aria-label={label}
      title={email}
    >
      {copied ? (
        <>
          <FiCheck size={16} /> Copied!
        </>
      ) : (
        <>
          <FiMail size={16} /> Email
        </>
      )}
    </button>
  );
}
