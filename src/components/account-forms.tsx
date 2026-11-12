"use client";

import {
  loginAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
} from "@/server/account";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { localePath } from "@/lib/locale-path";

const fieldClass =
  "min-h-12 rounded-2xl bg-stone px-4 text-xl font-normal text-ink ring-1 ring-line";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"credentials" | "rate" | "generic" | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAccount({ email, password, nextPath });
      if (result) setError(result.error);
    });
  }

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("email")}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("password")}
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
      </label>
      <a href={localePath(locale, "/account/forgot")} className="text-lg text-chapel underline">
        {t("forgot")}
      </a>
      {error ? (
        <p className="text-lg text-chapel" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
      >
        {pending ? t("working") : t("login")}
      </button>
      <a
        href={`${localePath(locale, "/account/register")}?next=${encodeURIComponent(nextPath)}`}
        className="text-lg text-chapel underline"
      >
        {t("noAccount")}
      </a>
    </form>
  );
}

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState<
    "name" | "email" | "phone" | "password" | "match" | "taken" | "rate" | "generic" | null
  >(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerAccount({
        name,
        email,
        phone,
        password,
        passwordAgain,
        nextPath,
      });
      if (result) setError(result.error);
    });
  }

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("name")}
        <input
          required
          autoComplete="name"
          value={name}
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
          value={email}
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
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={fieldClass}
        />
        <span className="text-lg font-normal text-ink">{t("phoneHint")}</span>
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("password")}
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
        <span className="text-lg font-normal text-ink">{t("passwordHint")}</span>
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("passwordAgain")}
        <input
          type="password"
          required
          autoComplete="new-password"
          value={passwordAgain}
          onChange={(event) => setPasswordAgain(event.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="text-lg text-chapel" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
      >
        {pending ? t("working") : t("register")}
      </button>
      <a
        href={`${localePath(locale, "/account/login")}?next=${encodeURIComponent(nextPath)}`}
        className="text-lg text-chapel underline"
      >
        {t("hasAccount")}
      </a>
    </form>
  );
}

export function ForgotForm() {
  const t = useTranslations("account");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<"rate" | "generic" | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return <p className="mt-6 text-xl leading-relaxed">{t("forgotSent")}</p>;
  }

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("email")}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="text-lg text-chapel" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
      >
        {pending ? t("working") : t("sendLink")}
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("account");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState<"password" | "match" | "invalid" | "generic" | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resetPassword({ token, password, passwordAgain });
      if (result) setError(result.error);
    });
  }

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("password")}
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
        <span className="text-lg font-normal text-ink">{t("passwordHint")}</span>
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
        {t("passwordAgain")}
        <input
          type="password"
          required
          autoComplete="new-password"
          value={passwordAgain}
          onChange={(event) => setPasswordAgain(event.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="text-lg text-chapel" role="alert">
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
      >
        {pending ? t("working") : t("savePassword")}
      </button>
    </form>
  );
}
