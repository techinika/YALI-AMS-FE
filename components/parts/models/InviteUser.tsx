// InviteUserModal.tsx
"use client";
import { useInviteUserMutation } from "@/lib/features/userSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdEmail, MdPerson, MdSend } from "react-icons/md";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  refetchUsers: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  refetchUsers,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inviteUser, { isLoading }] = useInviteUserMutation();

  if (!isOpen) {
    return null;
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInviteUser = async (name: string, email: string) => {
    try {
      const response = await inviteUser({
        firstName: name,
        email,
      }).unwrap();

      toastSuccess(`Invitation sent to ${name}!`);

      refetchUsers();
    } catch (err: any) {
      console.error("Invite error:", err);

      if (err?.data?.error) {
        toastError(err.data.error);
      } else {
        toastError("Failed to send invitation. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and Email are required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    handleInviteUser(name.trim(), email.trim());

    setName("");
    setEmail("");
    setIsSubmitting(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative z-50 transform scale-100 transition-transform duration-300">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Invite New Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Enter the first name and email of the member you wish to invite to the
          system.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="invite-name" className="sr-only">
              First Name
            </label>
            <div className="relative">
              <MdPerson className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="invite-name"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="invite-email" className="sr-only">
              Email Address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="invite-email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary/80 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
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
                  Sending...
                </>
              ) : (
                <>
                  <MdSend className="w-5 h-5 mr-2" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default InviteUserModal;
