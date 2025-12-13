// ChangePasswordPage.tsx - Modernized Version
"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  useChangePasswordMutation,
} from "@/lib/features/authSlice";
import { getUser } from "@/helpers/auth";
import { MdDone, MdError, MdVpnKey } from "react-icons/md"; // Added icons
import { Nut, Save } from "lucide-react";
import { PageHeader } from "../parts/PageHeader";
import { logout } from "@/helpers/logout";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { processLogout } from "@/lib/features/auth";

interface PasswordState {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialPasswordState: PasswordState = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

interface PasswordInputFieldProps {
  id: keyof PasswordState;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error: string;
  autoComplete: string;
}

const PasswordInputField: React.FC<PasswordInputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}) => (
  <div className="flex flex-col space-y-2">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={`w-full p-3 pl-10 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out bg-white/90 shadow-sm
          ${error ? "border-red-500 pr-10" : "border-gray-300"}
        `}
      />
      {/* Icon inside input */}
      <MdVpnKey className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      {/* Error icon */}
      {error && (
        <MdError className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
      )}
    </div>
    {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
  </div>
);

const ChangePasswordPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<PasswordState>(initialPasswordState);
  const [errors, setErrors] = useState<Partial<PasswordState>>({});
  const [message, setMessage] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const user = getUser();
  const [changePassword] = useChangePasswordMutation();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof PasswordState]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setGlobalError("");
    setMessage("");
  };

  const validate = (): boolean => {
    let tempErrors: Partial<PasswordState> = {};
    let isValid = true;

    if (!formData.oldPassword) {
      tempErrors.oldPassword = "Your current password is required";
      isValid = false;
    }

    if (!formData.newPassword || formData.newPassword.length < 8) {
      tempErrors.newPassword =
        "New password must be at least 8 characters long";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Please confirm the new password";
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords must match";
      isValid = false;
    }

    if (
      formData.newPassword === formData.oldPassword &&
      formData.newPassword.length >= 8
    ) {
      tempErrors.newPassword =
        "New password cannot be the same as the old password";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setGlobalError("");
    setMessage("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword({
        userId: user?.id,
        pastPassword: formData.oldPassword,
        password: formData.newPassword,
      }).unwrap();

      if (result?.status === 200) {
        setMessage(
          "Password changed successfully. Logging out for security..."
        );
        await logout();
        dispatch(processLogout());
        router.push("/");
      } else {
        setGlobalError(result?.message || "Password change failed.");
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      const errorMessage =
        error?.data?.error ||
        "Incorrect old password or a server error occurred.";

      if (error?.status === 401) {
        setErrors((prev) => ({ ...prev, oldPassword: errorMessage }));
      } else {
        setGlobalError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <PageHeader
        title={"Change Password"}
        description="Update your account password to keep your profile secure."
        actionTitle="Save Password"
        Icon={Save}
        onAction={handleSubmit}
        loading={loading}
        disabled={false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("ff")}
        loading2={false}
        disabled2={false}
        Icon2={Nut}
      />
      <div className="w-full max-w-lg flex justify-center items-center mx-auto my-3">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {(message || globalError) && (
            <div
              className={`mt-2 p-3 flex items-center text-sm font-medium rounded-xl border ${
                message
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {message ? (
                <MdDone className="w-5 h-5 mr-2" />
              ) : (
                <MdError className="w-5 h-5 mr-2" />
              )}
              {message || globalError}
            </div>
          )}
          <PasswordInputField
            id="oldPassword"
            label="Current Password"
            value={formData.oldPassword}
            onChange={handleChange}
            error={errors.oldPassword || ""}
            autoComplete="current-password"
          />

          <PasswordInputField
            id="newPassword"
            label="New Password (min 8 characters)"
            value={formData.newPassword}
            onChange={handleChange}
            error={errors.newPassword || ""}
            autoComplete="new-password"
          />

          <PasswordInputField
            id="confirmPassword"
            label="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword || ""}
            autoComplete="new-password"
          />
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
