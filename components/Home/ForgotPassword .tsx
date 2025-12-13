import { useRequestResetMutation } from "@/lib/features/authSlice";
import React, { useEffect, useState, useCallback } from "react";
import Header from "./Header";
import { ErrorType } from "@/types/feedback";
import Link from "next/link";
import { toastError } from "@/lib/toast";

const InputError = ({ error }: { error: string }) => {
  if (!error) return null;
  return <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>;
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email: string }>({ email: "" });
  const [isTouched, setIsTouched] = useState<{ email: boolean }>({
    email: false,
  });

  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const [requestReset] = useRequestResetMutation();

  const validateEmail = (value: string) => {
    if (!value) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Invalid Email format";
    }
    return "";
  };

  const handleValidate = useCallback(() => {
    const emailError = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: emailError }));
    return !emailError;
  }, [email]);

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => {
        setApiError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccess("");

    setIsTouched({ email: true });

    const isValid = handleValidate();

    if (!isValid) {
      toastError("Validation failed on submission.");
      return;
    }

    setLoading(true);

    try {
      const values = { email };
      const response = await requestReset(values).unwrap();

      if (response.status === 200) {
        setSuccess(response.message);
      }
    } catch (error) {
      const e = error as unknown as ErrorType;
      if (e?.status === 404) {
        setApiError(e?.data?.message);
      } else {
        setApiError("Action Failed! Try again, or contact the administrator!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);

    if (isTouched.email) {
      const emailError = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: emailError }));
    }
  };

  const handleBlur = () => {
    if (!isTouched.email) {
      setIsTouched((prev) => ({ ...prev, email: true }));
    }
    handleValidate();
  };

  const currentEmailError = isTouched.email ? errors.email : "";
  const isFormValid = !errors.email && email;

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-md flex flex-col items-center bg-white border border-blue-200 rounded-xl shadow-2xl p-6 sm:p-8">
        <Header />

        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
          Forgot Password
        </h2>

        {success && (
          <div className="w-full mb-4">
            <p className="bg-green-100 text-green-800 border border-green-500 rounded-lg text-center p-3 font-medium">
              {success}
            </p>
          </div>
        )}

        {/* Form or Error View */}
        {!success && (
          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            {/* API Error Message */}
            {apiError && (
              <div className="w-full mb-4">
                <p className="bg-red-100 text-red-800 border border-red-500 rounded-lg text-center p-3 font-medium">
                  {apiError}
                </p>
              </div>
            )}

            {/* Email Input Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter your email address:
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={`w-full p-3 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-150
                  ${currentEmailError ? "border-red-500" : "border-gray-300"}`}
                placeholder="you@example.com"
              />
              <InputError error={currentEmailError} />
            </div>

            <div className="flex flex-col gap-2 justify-center items-center">
              <button
                type="submit"
                className={`w-full px-4 py-3 text-lg font-bold text-white rounded-lg shadow-md transition duration-300 transform active:scale-95
                ${
                  loading || !isFormValid
                    ? "bg-primary cursor-not-allowed"
                    : "bg-primary hover:bg-primary hover:shadow-lg"
                }`}
                disabled={loading || !isFormValid}
              >
                {loading ? "Requesting Reset..." : "Request Password Reset"}
              </button>
              <Link
                href="/"
                className="text-center underline text-primary p-2 w-full"
              >
                Go back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
