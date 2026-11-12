import { notFound } from "next/navigation";
import { requireUser } from "@/entities/user/server";
import { VendorsWorkspace, VendorDetailWorkspace } from "./vendors-workspace";
type CompanySearch = { companyId?: string | string[] };
function companyFromSearch(value: CompanySearch["companyId"]) {
  if (
    value !== undefined &&
    (typeof value !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
  )
    notFound();
  return value;
}
export async function VendorsPage({ searchParams }: { searchParams: Promise<CompanySearch> }) {
  const user = await requireUser(),
    companyId = companyFromSearch((await searchParams).companyId);
  return (
    <VendorsWorkspace key={user.id + companyId} userId={user.id} initialCompanyId={companyId} />
  );
}
export async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ vendorKey: string }>;
  searchParams: Promise<{ companyId?: string | string[] }>;
}) {
  const { vendorKey } = await params;
  if (!["linux", "mikrotik", "fortigate", "cisco", "sophos", "esxi", "pfsense"].includes(vendorKey))
    notFound();
  const companyId = companyFromSearch((await searchParams).companyId);
  const user = await requireUser();
  return (
    <VendorDetailWorkspace
      key={vendorKey + companyId}
      vendorKey={vendorKey}
      canRefresh={user.role !== "co_employee"}
      userId={user.id}
      initialCompanyId={companyId}
    />
  );
}
