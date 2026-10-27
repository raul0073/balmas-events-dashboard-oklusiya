"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface CheckboxOption {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  checkbox?: CheckboxOption;
  /** a notice with a single button instead of a destructive confirm */
  alertOnly?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title, description,
  confirmLabel = "אישור",
  cancelLabel  = "ביטול",
  checkbox,
  alertOnly = false,
}: Props) {
  const headerCls = alertOnly ? "bg-pikud-navy" : "bg-red-600";
  const confirmCls = alertOnly
    ? "h-10 bg-pikud-navy text-white hover:bg-pikud-navy-dark border-pikud-navy font-bold px-6"
    : "h-10 bg-red-600 text-white hover:bg-red-700 border-red-600 font-bold px-6";
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-pikud-navy/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-surface rounded-xl shadow-2xl overflow-hidden data-[state=open]:animate-fade-in focus:outline-none">

          {/* Header */}
          <div className={`${headerCls} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-1.5">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <Dialog.Title className="text-white font-bold text-lg">{title}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <Dialog.Description className="text-ink text-sm leading-relaxed">
              {description}
            </Dialog.Description>

            {/* Optional checkbox */}
            {checkbox && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkbox.checked}
                  onChange={(e) => checkbox.onChange(e.target.checked)}
                  className="w-4 h-4 rounded border-line-strong text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-ink-soft group-hover:text-ink select-none">
                  {checkbox.label}
                </span>
              </label>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3 justify-end">
            {!alertOnly && (
              <Button variant="outline" onClick={onClose} className="h-10">
                {cancelLabel}
              </Button>
            )}
            <Button
              autoFocus
              onClick={() => { onConfirm(); onClose(); }}
              className={confirmCls}
            >
              {confirmLabel}
            </Button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}