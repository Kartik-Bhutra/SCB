import { getCurrentUser } from "@/utils/userActions";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import Dashboard from "./(components)/Dashboard";

export default async function adminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { success, role, userId } = await getCurrentUser();
  if (!success) {
    redirect("/login", RedirectType.replace);
  }
  const header = await headers();
  const pathname = header.get("x-full-url");
  if (!pathname) {
    redirect("/login", RedirectType.replace);
  }
  if (pathname.startsWith("/admin/a2/") && !role) {
    redirect("/admin", RedirectType.replace);
  }
  return (
    <Dashboard role={role} userId={userId}>
      {children}
    </Dashboard>
  );
}
