"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * App-wide replacement for window.confirm / window.alert.
 * Call confirmDialog(...) or alertDialog(...) from anywhere; <DialogHost /> (mounted once in the root layout) renders them.
 */
interface Request {
  id: number;
  kind: "confirm" | "alert";
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (ok: boolean) => void;
}

type Listener = (r: Request | null) => void;
let listener: Listener | null = null;
let seq = 0;

function open(r: Omit<Request, "id" | "resolve">): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      // host not mounted (SSR or very early): fall back to the browser so nothing silently passes
      resolve(r.kind === "confirm" ? window.confirm(r.message) : (window.alert(r.message), true));
      return;
    }
    listener({ ...r, id: ++seq, resolve });
  });
}

export function confirmDialog(message: string, opts: { title?: string; confirmLabel?: string; cancelLabel?: string } = {}): Promise<boolean> {
  return open({ kind: "confirm", message, title: opts.title ?? "אישור פעולה", confirmLabel: opts.confirmLabel ?? "אישור", cancelLabel: opts.cancelLabel ?? "ביטול" });
}

export function alertDialog(message: string, opts: { title?: string } = {}): Promise<boolean> {
  return open({ kind: "alert", message, title: opts.title ?? "שים לב", confirmLabel: "הבנתי" });
}

export function DialogHost() {
  const [req, setReq] = useState<Request | null>(null);

  useEffect(() => {
    listener = setReq;
    return () => { listener = null; };
  }, []);

  if (!req) return null;
  const finish = (ok: boolean) => { req.resolve(ok); setReq(null); };

  return (
    <ConfirmDialog
      open
      onClose={() => finish(false)}
      onConfirm={() => finish(true)}
      title={req.title}
      description={req.message}
      confirmLabel={req.confirmLabel}
      cancelLabel={req.cancelLabel}
      alertOnly={req.kind === "alert"}
    />
  );
}
