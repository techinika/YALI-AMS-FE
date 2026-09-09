// ConfirmModal.tsx - Modernized Version
"use client";

import React from "react";
import { MdWarning, MdClose } from "react-icons/md";
import { createPortal } from "react-dom";
import { ModalButton } from "@/components/ui/modal-button";

interface ConfirmModalProps {
  closeModal: () => void;
  action: () => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  isLoading?: boolean;
}

function ConfirmModal({
  closeModal,
  action,
  title,
  description,
  confirmText,
  cancelText,
  isLoading = false,
}: ConfirmModalProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-md transform rounded-2xl bg-white p-6 text-left shadow-2xl transition-all sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <MdClose className="w-6 h-6" />
        </button>

        <div className="flex items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 border border-red-300">
            <MdWarning className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>

          <div className="mt-0 text-left sm:ml-4">
            <h3
              className="text-xl font-bold leading-6 text-gray-900 mb-2"
              id="modal-title"
            >
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <ModalButton
            onClick={closeModal}
            variant="cancel"
            disabled={isLoading}
          >
            {cancelText}
          </ModalButton>

          <ModalButton onClick={action} variant="confirm" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {confirmText.replace(/\.+$/, "")}...
              </span>
            ) : (
              confirmText
            )}
          </ModalButton>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
