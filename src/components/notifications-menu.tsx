"use client";

import { Bell, FileText, MessageCircleWarning, ShieldAlert, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HeaderNotification } from "@/lib/notifications";

function iconByKind(kind: HeaderNotification["kind"]) {
  if (kind === "message") return <MessageCircleWarning size={15} className="text-brand-700" />;
  if (kind === "ticket") return <Ticket size={15} className="text-amber-600" />;
  if (kind === "moderation") return <ShieldAlert size={15} className="text-rose-600" />;
  return <FileText size={15} className="text-slate-600" />;
}

export function NotificationsMenu({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: HeaderNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function clearAll() {
    startTransition(async () => {
      await fetch("/api/notifications/clear", { method: "POST" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100"
        title="Уведомления"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-fade-up absolute right-0 z-30 mt-2 w-[calc(100vw-24px)] max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-base font-semibold text-slate-900">Уведомления</p>
            <button
              type="button"
              onClick={clearAll}
              disabled={isPending || items.length === 0}
              className="text-sm font-semibold text-rose-500 disabled:opacity-50"
            >
              Удалить все
            </button>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Новых уведомлений нет</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={`/api/notifications/open?key=${encodeURIComponent(item.key)}&href=${encodeURIComponent(item.href)}`}
                    onClick={() => setOpen(false)}
                    prefetch={false}
                    className="block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{iconByKind(item.kind)}</span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                        <span className="mt-2 block h-2.5 w-2.5 rounded-full bg-brand-500" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
