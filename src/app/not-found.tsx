import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center px-4 py-12 text-center">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Страница не найдена</h1>
        <p className="mt-3 text-slate-600">Возможно, объявление было снято с публикации или ссылка устарела.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
        >
          Вернуться в каталог
        </Link>
      </section>
    </main>
  );
}
