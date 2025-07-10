import PasswordBtn from "./PasswordBtn";
export default function LoginForm() {
  return (
    <form className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-5">
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            User Id
          </label>
          <input
            type="text"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your user Id"
            name="userId"
          />
        </div>
        <PasswordBtn />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 rounded-lg border-gray-300 transition-all duration-200"
            id="remember-me"
            name="remember-me"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 text-xs sm:text-sm text-gray-600"
          >
            Remember me
          </label>
        </div>
        <button
          type="button"
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
          name="forget-password"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 sm:py-3 px-4 bg-blue-600 text-white rounded-xl font-medium text-sm sm:text-base
          transition-all duration-200 hover:bg-blue-700 focus:outline-none 
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
          transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        Sign In
      </button>
    </form>
  );
}
