import Link from "next/link";
import { redirect } from "next/navigation";
import { CityInput } from "@/components/city-input";
import { ensureMarketplaceSeed } from "@/lib/marketplace";
import { registerUser, signIn } from "@/lib/auth";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function registerAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !phone || !city || password.length < 6) {
    redirect("/auth/register?error=invalid");
  }

  const created = await registerUser({ name, phone, city, email, password });
  if (!created.ok) {
    redirect("/auth/register?error=phone_taken");
  }

  await signIn({ phone, password });
  redirect("/account");
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  await ensureMarketplaceSeed();
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Регистрация</h1>
        <p className="mt-2 text-sm text-slate-600">
          Номер телефона обязателен и уникален. На один номер можно создать только один аккаунт.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {params.error === "phone_taken"
              ? "Этот телефон уже зарегистрирован."
              : "Проверьте заполнение формы."}
          </p>
        ) : null}

        <form action={registerAction} className="mt-5 grid gap-3">
          <input required name="name" placeholder="Имя" className="rounded-xl border border-slate-300 px-3 py-2" />
          <input
            required
            name="phone"
            placeholder="Телефон"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
          <CityInput name="city" required />
          <input name="email" placeholder="Email (необязательно)" className="rounded-xl border border-slate-300 px-3 py-2" />
          <input
            required
            name="password"
            type="password"
            placeholder="Пароль"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />

          <button type="submit" className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Зарегистрироваться
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Уже есть аккаунт? <Link href="/auth/login" className="text-blue-700 hover:underline">Войти</Link>
        </p>
      </section>
    </main>
  );
}
