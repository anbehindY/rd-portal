"use client";

import { useState, type FormEvent } from "react";
import { COUNTRIES } from "@/lib/countries";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const MESSAGE_MAX = 2000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type FieldKey = "name" | "businessEmail" | "country" | "message";
type FieldErrors = Partial<Record<FieldKey, string>>;

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const maybeMessage = (body as { message?: unknown }).message;
  if (Array.isArray(maybeMessage)) {
    return maybeMessage.filter((m) => typeof m === "string").join(", ") || null;
  }
  if (typeof maybeMessage === "string") return maybeMessage;
  return null;
}

function validate(values: {
  name: string;
  businessEmail: string;
  country: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const email = values.businessEmail.trim();
  const country = values.country.trim();
  const message = values.message;

  if (name.length < 2) {
    errors.name = "Please enter your full name (at least 2 characters).";
  }
  if (!email) {
    errors.businessEmail = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.businessEmail = "Please enter a valid email address.";
  }
  if (!country) {
    errors.country = "Please select your country.";
  }
  if (message.length > MESSAGE_MAX) {
    errors.message = `Message must be ${MESSAGE_MAX} characters or fewer.`;
  }
  return errors;
}

export default function DemoForm() {
  const [name, setName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function clearFieldError(key: FieldKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetForm() {
    setName("");
    setBusinessEmail("");
    setCountry("");
    setMessage("");
    setFieldErrors({});
    setStatus({ kind: "idle" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors = validate({ name, businessEmail, country, message });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const trimmedMessage = message.trim();
    const payload = {
      name: name.trim(),
      businessEmail: businessEmail.trim(),
      country: country.trim(),
      message: trimmedMessage.length ? trimmedMessage : undefined,
    };

    setFieldErrors({});
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        setStatus({ kind: "success" });
        return;
      }

      if (res.status === 429) {
        setStatus({
          kind: "error",
          message: "Too many requests, please try again later.",
        });
        return;
      }

      if (res.status === 400) {
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          // ignore json parse error
        }
        setStatus({
          kind: "error",
          message:
            extractErrorMessage(body) ?? "Please check the form and try again.",
        });
        return;
      }

      setStatus({
        kind: "error",
        message: `Something went wrong (${res.status}). Please try again.`,
      });
    } catch {
      setStatus({
        kind: "error",
        message:
          "Unable to reach the server. Please check your connection and try again.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center gap-4 py-10">
        <div className="text-2xl font-bold text-black">
          Thanks &mdash; we&apos;ll be in touch.
        </div>
        <p className="text-zinc-600 max-w-sm">
          Your request was received. A member of our team will reach out
          shortly.
        </p>
        <div className="mt-2">
          <Button variant="ghost" size="md" onClick={resetForm}>
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-figtree font-bold text-black text-2xl leading-8 tracking-normal">
          Tell us about your request
        </h3>
        <p className="font-figtree font-normal text-[#78716D] text-sm leading-5 tracking-normal">
          Fill in the details and we&apos;ll get back to you within 2 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Full Name"
            htmlFor="name"
            required
            error={fieldErrors.name}
          >
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter full name"
              value={name}
              error={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Email"
            htmlFor="businessEmail"
            required
            error={fieldErrors.businessEmail}
          >
            <Input
              id="businessEmail"
              name="businessEmail"
              type="email"
              autoComplete="email"
              placeholder="Enter email address"
              value={businessEmail}
              error={Boolean(fieldErrors.businessEmail)}
              aria-describedby={
                fieldErrors.businessEmail ? "businessEmail-error" : undefined
              }
              onChange={(e) => {
                setBusinessEmail(e.target.value);
                clearFieldError("businessEmail");
              }}
              disabled={submitting}
            />
          </FormField>
        </div>

        <FormField
          label="Select Country"
          htmlFor="country"
          required
          error={fieldErrors.country}
        >
          <Select
            id="country"
            name="country"
            value={country}
            error={Boolean(fieldErrors.country)}
            aria-describedby={
              fieldErrors.country ? "country-error" : undefined
            }
            onChange={(e) => {
              setCountry(e.target.value);
              clearFieldError("country");
            }}
            disabled={submitting}
          >
            <option value="" disabled>
              Select country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Message"
          htmlFor="message"
          optional
          error={fieldErrors.message}
        >
          <Textarea
            id="message"
            name="message"
            rows={4}
            maxLength={MESSAGE_MAX}
            placeholder="Tell us about your needs..."
            value={message}
            error={Boolean(fieldErrors.message)}
            aria-describedby={
              fieldErrors.message ? "message-error" : undefined
            }
            onChange={(e) => {
              setMessage(e.target.value);
              clearFieldError("message");
            }}
            disabled={submitting}
          />
        </FormField>

        {status.kind === "error" && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {status.message}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          className="mt-1 w-full"
        >
          {submitting ? "Submitting\u2026" : "Request Demo"}
        </Button>

        <p className="text-center text-xs text-zinc-500 mt-1">
          No credit card required &middot; Free personalized walkthrough
        </p>
      </form>
    </div>
  );
}
