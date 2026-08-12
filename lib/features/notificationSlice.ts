import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../fetchBaseQuery";
import { ApiResponse, NotificationItem, NotificationSetup } from "@/types/api";

interface OpenNotificationData {
  id: string;
}

interface UpdateSetupData {
  id: string;
  message: string;
  usage: string;
  link: string;
}

export const notificationSlices = createApi({
  reducerPath: "notificationSlices",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    notifications: builder.query<{ notifications: NotificationItem[] }, string | void>({
      query: (id) => `notification/${id}`,
      providesTags: ["Notifications"],
    }),
    unopenedNotifications: builder.query<{ notifications: NotificationItem[] }, string | void>({
      query: (id) => `notification/unopened/${id}`,
      providesTags: ["Notifications"],
    }),
    notSetups: builder.query<{ data: NotificationSetup[] }, string | void>({
      query: () => `notification/update/setup`,
    }),
    notSetup: builder.query<{ data: NotificationSetup }, string | void>({
      query: (id) => `notification/update/setup/one?id=${id}`,
    }),
    openNotification: builder.mutation<{ message: string }, OpenNotificationData>({
      query: (credentials) => ({
        url: "notification",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Notifications"],
    }),
    updateSetup: builder.mutation<{ message: string }, UpdateSetupData>({
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
