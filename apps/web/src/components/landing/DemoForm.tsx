"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

// Same-origin by default (ALB routes /api/* to the API); override with
// NEXT_PUBLIC_API_URL for local dev where web :3000 and api :3001 differ.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const MESSAGE_MAX = 2000;

const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]];

const demoFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters).")
    .max(120, "Name must be 120 characters or fewer."),
  businessEmail: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address.")
    .max(254, "Email must be 254 characters or fewer."),
  country: z
    .enum(COUNTRY_CODES, { message: "Please select your country." }),
  message: z
    .string()
    .max(MESSAGE_MAX, `Message must be ${MESSAGE_MAX} characters or fewer.`)
    .optional(),
});

type DemoFormValues = z.infer<typeof demoFormSchema>;

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const maybeMessage = (body as { message?: unknown }).message;
  if (Array.isArray(maybeMessage)) {
    return maybeMessage.filter((m) => typeof m === "string").join(", ") || null;
  }
  if (typeof maybeMessage === "string") return maybeMessage;
  return null;
}

export default function DemoForm() {
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: "",
      businessEmail: "",
      country: undefined,
      message: "",
    },
  });

  function resetForm() {
    reset();
    setStatus({ kind: "idle" });
  }

  async function onSubmit(values: DemoFormValues) {
    const trimmedMessage = values.message?.trim();
    const payload = {
      name: values.name.trim(),
      businessEmail: values.businessEmail.trim(),
      country: values.country.trim(),
      message: trimmedMessage && trimmedMessage.length > 0 ? trimmedMessage : undefined,
    };

    setStatus({ kind: "idle" });

    try {
      const res = await fetch(`${API_URL}/api/leads`, {
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Full Name"
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Enter full name"
              error={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              disabled={isSubmitting}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Email"
            htmlFor="businessEmail"
            required
            error={errors.businessEmail?.message}
          >
            <Input
              id="businessEmail"
              type="email"
              autoComplete="email"
              placeholder="Enter email address"
              error={Boolean(errors.businessEmail)}
              aria-describedby={
                errors.businessEmail ? "businessEmail-error" : undefined
              }
              disabled={isSubmitting}
              {...register("businessEmail")}
            />
          </FormField>
        </div>

        <FormField
          label="Select Country"
          htmlFor="country"
          required
          error={errors.country?.message}
        >
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Select
                id="country"
                name={field.name}
                value={field.value ?? ""}
                placeholder="Select country"
                options={COUNTRIES.map((c) => ({
                  value: c.code,
                  label: c.name,
                }))}
                error={Boolean(errors.country)}
                aria-describedby={errors.country ? "country-error" : undefined}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </FormField>

        <FormField
          label="Message"
          htmlFor="message"
          optional
          error={errors.message?.message}
        >
          <Textarea
            id="message"
            rows={4}
            maxLength={MESSAGE_MAX}
            placeholder="Tell us about your needs..."
            error={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
            disabled={isSubmitting}
            {...register("message")}
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
          loading={isSubmitting}
          className="mt-1 w-full"
        >
          {isSubmitting ? "Submitting\u2026" : "Request Demo"}
        </Button>

        <p className="text-center text-xs text-zinc-500 mt-1">
          No credit card required &middot; Free personalized walkthrough
        </p>
      </form>
    </div>
  );
}
