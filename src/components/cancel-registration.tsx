"use client";

import { cancelRegistration } from "@/server/account";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function CancelRegistration({
  orderId,
  number,
  everyone,
}: {
  orderId: string;
  number: string | null;
  everyone?: boolean;
}) {
  const t = useTranslations("account");
  const router = useRouter();
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(everyone ? t("cancelAllConfirm") : t("cancelConfirm"))) return;
          setError(false);
          startTransition(async () => {
            const result = await cancelRegistration({ orderId, number });
            if (!result.ok) {
              setError(true);
              return;
            }
            router.refresh();
          });
        }}
        className="min-h-12 text-lg text-chapel underline disabled:opacity-60"
      >
        {everyone ? t("cancelAll") : t("cancelOne")}
      </button>
      {error ? (
        <p className="mt-2 text-lg text-chapel" role="alert">
          {t("cancelFailed")}
        </p>
      ) : null}
    </div>
  );
}
