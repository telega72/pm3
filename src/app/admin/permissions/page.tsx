import { listAllPermissions } from "@/lib/admin";

export default async function AdminPermissionsPage() {
  const permissions = await listAllPermissions();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h1 className="text-3xl font-extrabold text-slate-900">Права</h1>
      <p className="mt-1 text-sm text-slate-500">Системные permissions для ролей и групп.</p>

      <ul className="mt-4 space-y-2">
        {permissions.map((perm) => (
          <li key={perm.id} className="rounded-xl border border-slate-200 p-3">
            <p className="font-bold text-slate-900">{perm.label}</p>
            <p className="text-xs text-slate-500">{perm.key}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
