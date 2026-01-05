import { RedirectType, redirect } from "next/navigation";
import { isAdmin, isAuthorized } from "@/server/auth";
import Dashboard from "../(components)/Dashboard";

export default async function adminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const verfied = await isAdmin();
  if (!verfied) {
    redirect("/login", RedirectType.replace);
  }

  return <Dashboard type={true}>{children}</Dashboard>;
}
