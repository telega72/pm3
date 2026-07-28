import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureMarketplaceSeed } from "@/lib/marketplace";
import { resetPasswordByToken } from "@/lib/auth";

type ResetPageProps = {
  searchParams: Promise<{ token?: string; error?: string; done?: string }>;
};

async function resetAction(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token || password.length < 6) {
    redirect(`/auth/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
  }

  const res = await resetPasswordByToken(token, password);
  if (!res.ok) {
    redirect(`/auth/reset-password?token=${encodeURIComponent(token)}&error=token`);
  }

  redirect("/auth/login?done=password_reset");
}

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  await ensureMarketplaceSeed();

  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Новый пароль</h1>

        {params.error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Невалидный или истекший токен, либо слишком короткий пароль.
          </p>
        ) : null}

        {!token ? (
          <p className="mt-4 text-sm text-slate-600">
            Отсутствует токен. Перейдите на страницу <Link href="/auth/forgot-password" className="text-blue-700 underline">восстановления</Link>.
          </p>
        ) : (
          <form action={resetAction} className="mt-5 grid gap-3">
            <input type="hidden" name="token" value={token} />
            <input
              required
              name="password"
              type="password"
              placeholder="Новый пароль"
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
              Сохранить пароль
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
