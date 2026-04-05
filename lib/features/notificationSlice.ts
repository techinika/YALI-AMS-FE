import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";

export const notificationSlices = createApi({
  reducerPath: "notificationSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    notifications: builder.query({
      query: (id) => `notification/${id}`,
    }),
    unopenedNotifications: builder.query({
      query: (id) => `notification/unopened/${id}`,
    }),
    notSetups: builder.query({
      query: () => `notification/update/setup`,
    }),
    notSetup: builder.query({
      query: (id) => ({ url: `notification/update/setup/one`, body: id }),
    }),
    openNotification: builder.mutation({
      query: (credentials) => ({
        url: "notification",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Notifications"],
    }),
    updateSetup: builder.mutation({
      query: (data) => ({
        url: "notification/update/setup",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useNotificationsQuery,
  useOpenNotificationMutation,
  useUnopenedNotificationsQuery,
  useLazyNotificationsQuery,
  useNotSetupsQuery,
  useNotSetupQuery,
  useUpdateSetupMutation,
} = notificationSlices;
