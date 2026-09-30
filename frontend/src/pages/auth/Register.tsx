import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../../components/layout/Logo";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { IMG, cities } from "../../data/mock";

const perks = [
  "Lifestyle quiz that powers every match",
  "Compatibility breakdown before you message",
  "Verified members only, no broker listings",
  "Split rent and bills transparently",
];

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "Bengaluru",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (
      form.phone &&
      form.phone.replace(/\D/g, "").length < 10
    ) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password,
      });

      /*
       * Registration succeeded.
       *
       * For the authentication test requirement,
       * send the user to the dashboard.
       */
      navigate("/app/dashboard", {
        replace: true,
      });

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.05fr]">

      {/* LEFT IMAGE */}
      <div className="relative hidden lg:block">

        <img
          src={IMG.room2}
          alt="Shared flat living room"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-violet-coral opacity-85" />

        <div className="relative flex h-full flex-col justify-center p-12 text-white">

          <p className="font-display text-4xl font-extrabold leading-tight">
            Move in with someone who lives like you do.
          </p>

          <ul className="mt-8 space-y-3">

            {perks.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-3 text-sm text-white/90"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <CheckIcon
                    className="h-3 w-3"
                    aria-hidden
                  />
                </span>

                {perk}
              </li>
            ))}

          </ul>

        </div>
      </div>

      {/* FORM */}
      <div className="flex flex-col justify-center bg-cream-200 px-6 py-12 sm:px-12">

        <div className="mx-auto w-full max-w-md">

          <Logo />

          <h1 className="mt-10 font-display text-3xl font-extrabold tracking-tight text-navy-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-navy-500">
            Create your account and start finding compatible roommates.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 space-y-4"
            noValidate
          >

            {/* FULL NAME */}
            <Field
              label="Full name"
              htmlFor="name"
              required
            >
              <Input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Priya Nair"
              />
            </Field>

            {/* EMAIL */}
            <Field
              label="Email"
              htmlFor="remail"
              required
            >
              <Input
                id="remail"
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

            {/* PHONE + CITY */}
            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Phone"
                htmlFor="phone"
              >
                <Input
                  id="phone"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  placeholder="98XXXXXXXX"
                />
              </Field>

              <Field
                label="City"
                htmlFor="city"
                required
              >
                <Select
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      city: event.target.value,
                    })
                  }
                >
                  {cities.map((city) => (
                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>
                  ))}
                </Select>
              </Field>

            </div>

            {/* PASSWORDS */}
            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Password"
                htmlFor="pwd"
                required
              >
                <Input
                  id="pwd"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password: event.target.value,
                    })
                  }
                  placeholder="At least 8 characters"
                />
              </Field>

              <Field
                label="Confirm password"
                htmlFor="cpwd"
                required
              >
                <Input
                  id="cpwd"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      confirm: event.target.value,
                    })
                  }
                  placeholder="Repeat password"
                />
              </Field>

            </div>

            {/* ERROR */}
            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-600"
              >
                {error}
              </p>
            )}

            {/* REGISTER */}
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              block
              loading={loading}
              icon={
                <ArrowRightIcon
                  className="h-4 w-4"
                  aria-hidden
                />
              }
            >
              Create account & continue
            </Button>

          </form>

          <p className="mt-6 text-sm text-navy-500">
            Already a member?{" "}
            <Link
              to="/login"
              className="font-bold text-violet-600 hover:text-violet-700"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}