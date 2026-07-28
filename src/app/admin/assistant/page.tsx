import { aiSupportAction, assignTicketToMeAction, closeTicketAction } from "@/lib/admin-actions";
import { listAiLogs, listOpenTickets } from "@/lib/ai-assistant";

type Props = {
  searchParams: Promise<{ reply?: string; ticket?: string; error?: string; saved?: string }>;
};

export default async function AdminAssistantPage({ searchParams }: Props) {
  const [logs, tickets, params] = await Promise.all([listAiLogs(30), listOpenTickets(), searchParams]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h1 className="text-3xl font-extrabold text-slate-900">ИИ Ассистент</h1>
        <p className="mt-1 text-sm text-slate-500">Диалог управления AI-помощником и тест поддержки.</p>

        <form action={aiSupportAction} className="mt-4 space-y-3">
          <textarea
            name="question"
            rows={5}
            placeholder="Введите вопрос пользователя в поддержку..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <button className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">Отправить в ИИ</button>
        </form>

        {params.reply ? (
          <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
            <p className="font-bold">Ответ ИИ:</p>
            <p className="mt-1">{params.reply}</p>
            {params.ticket ? <p className="mt-2 text-xs font-semibold">Создан тикет #{params.ticket}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-2xl font-extrabold text-slate-900">Открытые тикеты</h2>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Открытых тикетов нет.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-bold text-slate-900">#{ticket.id} · {ticket.subject}</p>
                <p className="text-xs text-slate-500">{ticket.userName}</p>
                <p className="mt-2 text-sm text-slate-700">{ticket.question}</p>
                <div className="mt-3 flex gap-2">
                  <form action={assignTicketToMeAction}>
                    <input type="hidden" name="ticketId" value={String(ticket.id)} />
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Назначить мне</button>
                  </form>
                  <form action={closeTicketAction}>
                    <input type="hidden" name="ticketId" value={String(ticket.id)} />
                    <button className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Закрыть</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-2xl font-extrabold text-slate-900">Журнал действий ИИ</h2>
        <ul className="mt-3 space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{log.actionType}</p>
              <p className="mt-1 text-sm text-slate-700">{log.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
