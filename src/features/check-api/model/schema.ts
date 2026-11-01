import { z } from "zod";
export const checkApiSchema = z.object({
  url: z
    .url({ message: "آدرس معتبر وارد کنید." })
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      "از HTTP یا HTTPS استفاده کنید.",
    ),
});
export type CheckApiValues = z.infer<typeof checkApiSchema>;
