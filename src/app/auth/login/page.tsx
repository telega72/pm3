import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureMarketplaceSeed } from "@/lib/marketplace";
import { signIn } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function loginAction(formData: FormData) {
  "use server";

  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await signIn({ phone, password });
  if (!result.ok) {
    redirect("/auth/login?error=invalid");
  }

  redirect("/account");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await ensureMarketplaceSeed();
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Вход</h1>

        {params.error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Неверный телефон или пароль.</p>
        ) : null}

        <form action={loginAction} className="mt-5 grid gap-3">
          <input
            required
            name="phone"
            placeholder="Телефон"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
          <input
            required
            name="password"
            type="password"
            placeholder="Пароль"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />

          <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Войти
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-1 text-sm">
          <Link href="/auth/forgot-password" className="text-blue-700 hover:underline">
            Забыли пароль?
          </Link>
          <Link href="/auth/register" className="text-blue-700 hover:underline">
            Нет аккаунта? Зарегистрироваться
          </Link>
        </div>
      </section>
    </main>
  );
}
