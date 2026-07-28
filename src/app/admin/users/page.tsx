import Link from "next/link";
import { listUsersAdmin } from "@/lib/admin";

export default async function AdminUsersPage() {
  const users = await listUsersAdmin();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <h1 className="text-3xl font-extrabold text-slate-900">Пользователи</h1>
      <p className="mt-1 text-sm text-slate-500">Список всех учетных записей и быстрый доступ к редактированию.</p>

      <ul className="mt-5 space-y-2">
        {users.map((user) => (
          <li key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div>
              <p className="font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">
                {user.phone} · {user.city} · {user.isActive ? "active" : "blocked"}
              </p>
            </div>
            <Link href={`/admin/users/${user.id}`} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              Редактировать
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
