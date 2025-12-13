import LoginForm from "./(components)/LoginForm";
import KeyIcon from "./(components)/Key";
import { verify } from "@/server/verify";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const isLoggedIn = await verify();
  if (isLoggedIn) {
    redirect("/");
  }
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full sm:w-[95%] max-w-[400px] transition-all duration-300 hover:shadow-2xl">
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <KeyIcon />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome back!
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Please enter your details to sign in
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
