import { configureStore } from "@reduxjs/toolkit";
import { authSlices } from "./features/authSlice";
import { usersSlices } from "./features/userSlice";
import { otherSlices } from "./features/otherSlice";
import { chatSlices } from "./features/chatSlice";
import { notificationSlices } from "./features/notificationSlice";
import { statSlice } from "./features/statsSlice";
import { orgsSlices } from "./features/orgSlice";
import authReducer from "./features/auth";
import { activitySlices } from "./features/activitySlice";
import { matchmakingSlices } from "./features/matchMakingSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authSlices.reducerPath]: authSlices.reducer,
      [usersSlices.reducerPath]: usersSlices.reducer,
      [otherSlices.reducerPath]: otherSlices.reducer,
      [chatSlices.reducerPath]: chatSlices.reducer,
      [notificationSlices.reducerPath]: notificationSlices.reducer,
      [statSlice.reducerPath]: statSlice.reducer,
      [orgsSlices.reducerPath]: orgsSlices.reducer,
      [activitySlices.reducerPath]: activitySlices.reducer,
      [matchmakingSlices.reducerPath]: matchmakingSlices.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat([
        authSlices.middleware,
        usersSlices.middleware,
        otherSlices.middleware,
        chatSlices.middleware,
        notificationSlices.middleware,
        statSlice.middleware,
        orgsSlices.middleware,
        activitySlices.middleware,
        matchmakingSlices.middleware,
      ]),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
