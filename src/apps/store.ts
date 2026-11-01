import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/shared/api/base-api";
export const makeStore = () =>
  configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
export type AppStore = ReturnType<typeof makeStore>;
