import {useEffect, useState} from "react";
import type {FormEvent} from "react";
import authClient from "../lib/auth-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");

/*  useEffect(() => {
    console.log("LoginForm mounted");
    // Get the redirectTo parameter from the URL if it exists
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirectTo');
    if (redirectParam) {
     // setRedirectTo(redirectParam);
    }
  }, []);*/

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const {data, error} = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      }, {
        onSuccess:async (ctx) => {
          const authToken = ctx.response.headers.get("set-auth-token")
          localStorage.setItem("bearer_token", authToken!);
          const { data: authSession } = await authClient.listSessions({
            fetchOptions: {
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            }
          });
          console.log(authSession)
          const data = await fetch(`http://localhost:8787/content?path=src%2Fcontent%2Fblog%2Fhello-world.md`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })
        }
      });
/*
      if (error) {
        setError(error.message || "Sign in failed");
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        // Redirect to the redirectTo param or home page
        console.log("Signed in successfully", data);
        window.location.href = redirectTo;
      }*/
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      console.error("Sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Login to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" id="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password"
                     className="block text-sm font-medium leading-6 text-gray-900">
                Password
              </label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div
            className="mt-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm">
            Successfully signed in!
          </div>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          Not a member?{" "}
          <a href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Sign up now
          </a>
        </p>
        <div id="auth-status" className="mt-4 text-center text-sm"></div>
      </div>
    </div>
  );
}
