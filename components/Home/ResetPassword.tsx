"use client";

import { useResetPasswordMutation } from "@/lib/features/authSlice";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomInputError } from "../ui/input-error";
import Header from "./Header";
import { ErrorType } from "@/types/feedback";

const ResetPassword = () => {
  const { token: tokenParam } = useParams();
  const token = typeof tokenParam === "string" ? tokenParam : "";

  const [credentials, setCredentials] = useState({
    password: "",
    cPassword: "",
  });

  const [errors, setErrors] = useState({
    password: "",
    cPassword: "",
  });

  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [resetPassword] = useResetPasswordMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { password: "", cPassword: "" };
    const { password, cPassword } = credentials;

    if (!password) {
      newErrors.password = "New password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!cPassword) {
      newErrors.cPassword = "Please confirm your new password";
      isValid = false;
    } else if (password !== cPassword) {
      newErrors.cPassword = "Passwords must match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword({
        token,
        newPassword: credentials.password,
      }).unwrap();

      setCredentials({ password: "", cPassword: "" });
      setSuccessMessage(result.message);
    } catch (err) {
      const e = err as unknown as ErrorType;
      const errorData = e.data || {};
      if (e?.status === 401 && errorData.error) {
        setGeneralError(errorData.error);
      } else {
        setGeneralError(
          "Reset Failed! Try again, or contact the administrator!"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (generalError) {
      const timer = setTimeout(() => {
        setGeneralError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [generalError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-blue-200 transition duration-500 ease-in-out hover:shadow-xl">
        <Header />

        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
          Set a New Password
        </h2>

        {successMessage ? (
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200 shadow-md">
            <svg
              className="w-12 h-12 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p className="text-lg font-semibold text-green-800 mb-4">
              {successMessage}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-primary hover:bg-primary transition"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" method="POST">
            {generalError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative transition-all duration-300 shadow-md"
                role="alert"
              >
                <span className="block sm:inline">{generalError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                New Password (min 8 chars)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
                placeholder="Enter your new password"
              />
              <CustomInputError error={errors.password} />
            </div>

            <div>
              <label
                htmlFor="cPassword"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Repeat Password
              </label>
              <input
                id="cPassword"
                name="cPassword"
                type="password"
                value={credentials.cPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
                placeholder="Repeat the new password"
              />
              <CustomInputError error={errors.cPassword} />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 transform active:scale-95 ${
                  isLoading ? "opacity-70 cursor-not-allowed bg-primary" : ""
                }`}
              >
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
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
