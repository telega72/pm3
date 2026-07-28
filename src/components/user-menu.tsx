"use client";

import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/actions";

type UserMenuProps = {
  name: string;
  email?: string | null;
  avatarUrl: string | null;
  initial: string;
  isAdmin: boolean;
};

export function UserMenu({ name, email, avatarUrl, initial, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full px-1 py-1 transition hover:bg-slate-100"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-brand-600">
            <UserRound size={16} />
          </span>
        )}
        <span className="pr-1 text-sm font-medium text-slate-800">{name}</span>
      </button>

      {open ? (
        <div className="animate-fade-up absolute right-0 z-30 mt-2 w-[255px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-lg font-semibold text-slate-900">{name}</p>
            <p className="mt-0.5 truncate text-sm text-slate-400">{email || "email не указан"}</p>
          </div>

          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <UserRound size={17} /> Профиль
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ShieldCheck size={17} /> Админ-панель
              </Link>
            ) : null}

            <Link
              href={isAdmin ? "/admin/settings" : "/account"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Settings size={17} /> Настройки
            </Link>
          </div>

          <form action={signOutAction} className="border-t border-slate-100">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut size={17} /> Выйти
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
