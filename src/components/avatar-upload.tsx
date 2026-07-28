"use client";

import { Camera } from "lucide-react";
import { useRef } from "react";
import { uploadAvatarAction } from "@/lib/actions";

type AvatarUploadProps = {
  name: string;
  avatarUrl: string | null;
  initial: string;
};

export function AvatarUpload({ name, avatarUrl, initial }: AvatarUploadProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <form action={uploadAvatarAction} ref={formRef} className="group relative h-20 w-20 shrink-0">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-20 w-20 rounded-2xl object-cover" />
      ) : (
        <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-extrabold text-white">
          {initial}
        </span>
      )}

      <label className="absolute inset-0 grid cursor-pointer place-items-center rounded-2xl bg-slate-900/55 text-white opacity-0 transition group-hover:opacity-100">
        <Camera size={20} />
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
    </form>
  );
}
