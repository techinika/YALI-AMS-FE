import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
  ChangePasswordRequest,
} from "@/types/api";

export const authSlices = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation<{ message: string }, LogoutRequest>({
      query: (credentials) => ({
        url: "auth/logout",
        method: "POST",
        body: credentials,
      }),
    }),
    requestReset: builder.mutation<{ message: string; status?: number }, ResetPasswordRequest>({
      query: (credentials) => ({
        url: "auth/request-link",
        method: "POST",
        body: credentials,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordConfirmRequest>({
      query: (credentials) => ({
        url: "auth/reset-password",
        method: "POST",
        body: credentials,
      }),
    }),
    changePassword: builder.mutation<{ status: number; message: string }, ChangePasswordRequest>({
      query: (credentials) => ({
        url: "auth/change-pass",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRequestResetMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authSlices;
