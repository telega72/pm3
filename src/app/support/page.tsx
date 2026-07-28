import { MessageSquareHeart } from "lucide-react";
import { redirect } from "next/navigation";
import { askSupportAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

type Props = { searchParams: Promise<{ reply?: string; ticket?: string; error?: string }> };

export default async function SupportPage({ searchParams }: Props) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold text-slate-900">
          <MessageSquareHeart size={26} className="text-brand-600" /> Техподдержка
        </h1>
        <p className="mt-2 text-sm text-slate-500">Сначала отвечает ИИ-помощник. Если вопрос сложный — создаётся тикет для модератора.</p>

        <form action={askSupportAction} className="mt-5 grid gap-3">
          <textarea name="question" rows={6} required placeholder="Опишите ваш вопрос" className="rounded-xl border border-slate-300 px-3 py-2" />
          <button className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">Отправить</button>
        </form>

        {params.reply ? (
          <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
            <p className="font-bold">Ответ ИИ:</p>
            <p className="mt-1">{params.reply}</p>
            {params.ticket ? <p className="mt-2 text-xs font-semibold">Создан тикет #{params.ticket}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
