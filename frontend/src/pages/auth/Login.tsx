import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogInIcon } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../../components/layout/Logo";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { IMG } from "../../data/mock";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (!form.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(
        form.email,
        form.password
      );

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        const from =
          (location.state as { from?: string } | null)?.from;

        navigate(
          from && from.startsWith("/app")
            ? from
            : "/app/dashboard",
          { replace: true }
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">

      {/* LEFT SIDE */}
      <div className="flex flex-col justify-center bg-cream-200 px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">

          <Logo />

          <h1 className="mt-10 font-display text-3xl font-extrabold tracking-tight text-navy-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-navy-500">
            Sign in to see new matches, messages and room enquiries.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 space-y-4"
            noValidate
          >

            <Field
              label="Email"
              htmlFor="email"
              required
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                placeholder="you@gmail.com"
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              required
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password: event.target.value,
                  })
                }
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600"
              >
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">

              <label className="flex items-center gap-2 text-sm font-semibold text-navy-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-cream-300 text-violet-600 focus:ring-violet-400"
                />

                Keep me signed in
              </label>

              <span className="text-sm font-semibold text-navy-400">
                Forgot password?
              </span>

            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              block
              loading={loading}
              icon={
                <LogInIcon
                  className="h-4 w-4"
                  aria-hidden
                />
              }
            >
              Sign in
            </Button>

          </form>

          <p className="mt-6 text-sm text-navy-500">
            New to Roomie2Homie?{" "}
            <Link
              to="/register"
              className="font-bold text-violet-600 hover:text-violet-700"
            >
              Create an account
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative hidden lg:block">

        <img
          src={IMG.hero}
          alt="Flatmates together in a bright living room"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-navy-900/55" />

        <div className="relative flex h-full flex-col justify-end p-12 text-white">

          <Badge tone="coral">
            Roomie2Homie
          </Badge>

          <p className="mt-5 max-w-md font-display text-3xl font-extrabold leading-tight">
            Find a roommate who matches your lifestyle.
          </p>

          <p className="mt-3 text-sm text-cream-200/80">
            Discover compatible people, rooms and shared living spaces.
          </p>

        </div>

      </div>

    </div>
  );
}