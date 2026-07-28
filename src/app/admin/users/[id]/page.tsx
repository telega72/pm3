import { redirect } from "next/navigation";
import { assignUserGroups, canUsePhone, getUserWithGroups, updateUserByAdmin } from "@/lib/admin";
import { getCurrentUser, PERMISSIONS } from "@/lib/auth";
import { ensureMarketplaceSeed } from "@/lib/marketplace";

async function updateUserAction(formData: FormData) {
  "use server";

  const current = await getCurrentUser();
  if (!current || !current.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
    redirect("/");
  }

  const id = Number(formData.get("id") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "on";

  const groupIds = formData
    .getAll("groupIds")
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!id || !name || !phone || !city) {
    redirect(`/admin/users/${id}?error=invalid`);
  }

  const free = await canUsePhone(phone, id);
  if (!free) {
    redirect(`/admin/users/${id}?error=phone`);
  }

  await updateUserByAdmin({
    id,
    name,
    phone,
    city,
    email,
    isActive,
    password,
  });

  await assignUserGroups(id, groupIds);

  redirect(`/admin/users/${id}?saved=1`);
}

type AdminUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminUserPage({ params, searchParams }: AdminUserPageProps) {
  await ensureMarketplaceSeed();

  const current = await getCurrentUser();
  if (!current || !current.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
    redirect("/");
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) redirect("/admin");

  const data = await getUserWithGroups(userId);
  if (!data) redirect("/admin");

  const sp = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Редактирование пользователя</h1>

      {sp.saved ? <p className="mt-3 text-sm text-emerald-700">Сохранено.</p> : null}
      {sp.error ? <p className="mt-3 text-sm text-rose-700">Ошибка сохранения.</p> : null}

      <form action={updateUserAction} className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-6">
        <input type="hidden" name="id" value={String(data.user.id)} />

        <input name="name" defaultValue={data.user.name} className="rounded-xl border border-slate-300 px-3 py-2" />
        <input name="phone" defaultValue={data.user.phone} className="rounded-xl border border-slate-300 px-3 py-2" />
        <input name="city" defaultValue={data.user.city} className="rounded-xl border border-slate-300 px-3 py-2" />
        <input
          name="email"
          defaultValue={data.user.email ?? ""}
          className="rounded-xl border border-slate-300 px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Новый пароль (необязательно)"
          className="rounded-xl border border-slate-300 px-3 py-2"
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isActive" defaultChecked={data.user.isActive} />
          Аккаунт активен
        </label>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">Группы пользователя</p>
          <div className="grid gap-2">
            {data.groups.map((group) => (
              <label key={group.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="groupIds" value={group.id} defaultChecked={data.selectedGroupIds.includes(group.id)} />
                {group.name} ({group.slug})
              </label>
            ))}
          </div>
        </div>

        <button className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">Сохранить</button>
      </form>
    </main>
  );
}
