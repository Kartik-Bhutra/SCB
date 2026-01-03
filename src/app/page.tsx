import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Army Admin</h1>
      <Link className="text-blue-600 m-10 text-xl" href="/login">
        Login as Admin
      </Link>
      <Link className="text-blue-600 m-10 text-xl" href="/secure">
        Login as Manager
      </Link>
    </main>
  );
}
