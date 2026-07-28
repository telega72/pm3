import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureMarketplaceSeed } from "@/lib/marketplace";
import { requestPasswordReset } from "@/lib/auth";

type ForgotPageProps = {
  searchParams: Promise<{ token?: string; done?: string }>;
};

async function forgotAction(formData: FormData) {
  "use server";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) redirect("/auth/forgot-password");

  const result = await requestPasswordReset(phone);
  if (result.ok && result.token) {
    redirect(`/auth/forgot-password?done=1&token=${result.token}`);
  }

  redirect("/auth/forgot-password?done=1");
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPageProps) {
  await ensureMarketplaceSeed();
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Восстановление пароля</h1>
        <p className="mt-2 text-sm text-slate-600">Введите телефон, привязанный к учетной записи.</p>

        <form action={forgotAction} className="mt-5 grid gap-3">
          <input
            required
            name="phone"
            placeholder="Телефон"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
          <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Сбросить пароль
          </button>
        </form>

        {params.done ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            Запрос обработан.
            {params.token ? (
              <>
                <br />
                Тестовая ссылка: <Link href={`/auth/reset-password?token=${params.token}`} className="underline">открыть форму сброса</Link>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
