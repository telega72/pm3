import { redirect } from "next/navigation";
import { createGroup, listAllPermissions, listGroupsWithPermissions, updateGroupFreeLimit } from "@/lib/admin";

type Props = { searchParams: Promise<{ saved?: string; error?: string }> };

async function createGroupAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const freeAdsPerMonth = Number(formData.get("freeAdsPerMonth") ?? 0);
  const permissionIds = formData
    .getAll("permissionIds")
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);

  if (!name || !slug) redirect("/admin/groups?error=1");

  await createGroup({ name, slug, description, permissionIds, freeAdsPerMonth: Math.max(0, freeAdsPerMonth) });
  redirect("/admin/groups?saved=1");
}

async function updateLimitAction(formData: FormData) {
  "use server";
  const id = Number(formData.get("id") ?? 0);
  const freeAdsPerMonth = Number(formData.get("freeAdsPerMonth") ?? 0);
  if (!id) redirect("/admin/groups?error=1");

  await updateGroupFreeLimit(id, freeAdsPerMonth);
  redirect("/admin/groups?saved=limit");
}

export default async function AdminGroupsPage({ searchParams }: Props) {
  const [groups, permissions, params] = await Promise.all([
    listGroupsWithPermissions(),
    listAllPermissions(),
    searchParams,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h1 className="text-3xl font-extrabold text-slate-900">Группы пользователей</h1>
        <ul className="mt-4 space-y-2">
          {groups.map((group) => (
            <li key={group.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-bold text-slate-900">{group.name}</p>
              <p className="text-xs text-slate-500">slug: {group.slug}</p>
              <p className="mt-1 text-xs text-slate-500">Права: {group.permissions.join(", ") || "нет"}</p>
              <form action={updateLimitAction} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="id" value={group.id} />
                <input
                  type="number"
                  min={0}
                  name="freeAdsPerMonth"
                  defaultValue={group.freeAdsPerMonth}
                  className="w-28 rounded-xl border border-slate-300 px-2 py-1 text-xs"
                />
                <button className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">Сохранить лимит</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-extrabold text-slate-900">Создать группу</h2>
        {params.saved ? <p className="mt-2 text-xs text-emerald-600">Сохранено</p> : null}
        {params.error ? <p className="mt-2 text-xs text-rose-600">Проверьте поля</p> : null}

        <form action={createGroupAction} className="mt-4 space-y-3">
          <input name="name" required placeholder="Название" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          <input name="slug" required placeholder="slug" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          <textarea name="description" rows={3} placeholder="Описание" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          <input type="number" min={0} name="freeAdsPerMonth" defaultValue={10} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Бесплатных объявлений в месяц" />

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-bold text-slate-800">Права</p>
            <div className="space-y-1">
              {permissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" name="permissionIds" value={perm.id} />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>

          <button className="w-full rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">Создать</button>
        </form>
      </section>
    </div>
  );
}
