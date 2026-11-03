import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const fetchQuery = fetchBaseQuery({
  baseUrl: "/api/",
  credentials: "same-origin",
  timeout: 25000,
});
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: async (args, api, extraOptions) => {
    const result = await fetchQuery(args, api, extraOptions);
    if (
      result.error?.status === 401 &&
      typeof window !== "undefined" &&
      (window.location.pathname === "/dashboard" ||
        window.location.pathname.startsWith("/dashboard/"))
    )
      window.location.replace("/login");
    return result;
  },
  tagTypes: ["CurrentUser", "Devices"],
  endpoints: () => ({}),
});
