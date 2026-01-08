"use client";

import { useLoginMutation } from "@/lib/features/authSlice";
import { useEffect, useState } from "react";
import { CustomInputError } from "../ui/input-error";
import Header from "./Header";
import { ErrorType } from "@/types/feedback";
import { setCookie } from "cookies-next";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { setCredentials } from "@/lib/features/auth";

const AUTH_STORED_DATA = {
  USER: "auth_user_data",
  TOKEN: "auth_token",
};

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [login] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid Email format";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData).unwrap();

      localStorage.setItem(
        AUTH_STORED_DATA?.USER,
        JSON.stringify(result?.user)
      );
      setCookie(AUTH_STORED_DATA?.TOKEN, result?.token);
      setCookie(AUTH_STORED_DATA?.USER, JSON.stringify(result?.user));

      dispatch(
        setCredentials({
          token: result?.token,
          user: result?.user,
        })
      );

      if (result?.status === 200) {
        if (result?.user?.role?.name === "ADMIN") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard/profile");
        }
      }
    } catch (err) {
      console.log(err);
      const e = err as unknown as ErrorType;
      const errorData = e?.data || {};
      if (errorData) {
        if (e?.status === 401 && errorData.error) {
          setGeneralError(errorData.error);
        } else {
          setGeneralError("An unexpected error occurred. Please try again.");
        }
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
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
              placeholder="you@example.com"
            />
            <CustomInputError error={errors.email} />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary transition"
              >
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
              placeholder="••••••••"
            />
            <CustomInputError error={errors.password} />
          </div>

          {/* Submit Button */}
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
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
