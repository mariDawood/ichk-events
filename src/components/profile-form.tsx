"use client";

import { updateProfile } from "@/server/account";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

const fieldClass =
  "min-h-12 rounded-2xl bg-stone px-4 text-xl font-normal text-ink ring-1 ring-line";

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const t = useTranslations("account");
  const [nextName, setName] = useState(name);
  const [nextEmail, setEmail] = useState(email);
  const [nextPhone, setPhone] = useState(phone);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<"name" | "email" | "phone" | "taken" | "account" | "generic" | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({ name: nextName, email: nextEmail, phone: nextPhone });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("name")}
        <input
          required
          autoComplete="name"
          value={nextName}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("email")}
        <input
          type="email"
          required
          autoComplete="email"
          value={nextEmail}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("phone")}
        <input
          type="tel"
          required
          autoComplete="tel"
          value={nextPhone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="text-lg text-chapel" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      {saved ? <p className="text-lg">{t("saved")}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-14 w-fit items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
      >
        {pending ? t("working") : t("save")}
      </button>
    </form>
  );
}
