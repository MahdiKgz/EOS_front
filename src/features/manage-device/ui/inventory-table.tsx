import type { ReactNode } from "react";
export function InventoryTable({
  title,
  headers,
  rows,
  open = false,
  unavailable = false,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
  open?: boolean;
  unavailable?: boolean;
}) {
  return (
    <details className="min-w-0 rounded-lg border bg-background p-3" open={open}>
      <summary className="cursor-pointer text-sm font-medium">
        {title} · {unavailable ? "دادهٔ کامل در دسترس نیست" : rows.length.toLocaleString("fa-IR")}
      </summary>
      {rows.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-start text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                {headers.map((header) => (
                  <th key={header} scope="col" className="p-2 text-start">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b last:border-0">
                  {row.map((cell, i) => (
                    <td key={i} className="p-2">
                      <bdi>{cell ?? "—"}</bdi>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">داده‌ای برای این بخش گزارش نشده است.</p>
      )}
    </details>
  );
}
