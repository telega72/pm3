"use client";

import { Eye, Phone } from "lucide-react";
import { useState } from "react";

type Props = {
  phone: string;
  canReveal: boolean;
};

export function PhoneReveal({ phone, canReveal }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!canReveal) {
    return (
      <div className="mt-5 rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-500">
        Войдите, чтобы увидеть номер
      </div>
    );
  }

  if (revealed) {
    return (
      <a
        href={`tel:${phone}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        <Phone size={16} /> {phone}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
    >
      <Eye size={16} /> Показать номер
    </button>
  );
}
