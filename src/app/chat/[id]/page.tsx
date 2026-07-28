import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sendMessageAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { ensureMarketplaceSeed, toRub } from "@/lib/marketplace";
import { getConversationForUser } from "@/lib/social";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { eq } from "drizzle-orm";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  await ensureMarketplaceSeed();

  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) redirect("/account?tab=chats");

  const data = await getConversationForUser(conversationId, current.id);
  if (!data) redirect("/account?tab=chats");

  const { counterpart, messages } = data;

  const [ad] = await db
    .select({ id: ads.id, title: ads.title, priceRub: ads.priceRub })
    .from(ads)
    .where(eq(ads.id, data.conversation.adId))
    .limit(1);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/account?tab=chats" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft size={16} /> Все чаты
      </Link>

      <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
              {counterpart?.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-bold text-slate-900">{counterpart?.name}</p>
              {ad ? (
                <Link href={`/ad/${ad.id}`} className="text-xs text-slate-500 hover:text-brand-700">
                  {ad.title} · {toRub(ad.priceRub)}
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex max-h-[55vh] min-h-[320px] flex-col gap-3 overflow-y-auto bg-slate-50/60 px-5 py-5">
          {messages.length === 0 ? (
            <p className="m-auto text-sm text-slate-400">Напишите первое сообщение — продавец получит его сразу.</p>
          ) : (
            messages.map((message) => {
              const own = message.senderId === current.id;
              return (
                <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      own ? "rounded-br-md bg-gradient-to-r from-brand-500 to-brand-700 text-white" : "rounded-bl-md bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.body}</p>
                    <p className={`mt-1 text-[10px] ${own ? "text-brand-100" : "text-slate-400"}`}>
                      {new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
                        message.createdAt,
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form action={sendMessageAction} className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
          <input type="hidden" name="conversationId" value={String(conversationId)} />
          <input
            required
            name="body"
            placeholder="Ваше сообщение..."
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-md shadow-brand-200 transition hover:shadow-lg"
          >
            <Send size={17} />
          </button>
        </form>
      </section>
    </main>
  );
}
