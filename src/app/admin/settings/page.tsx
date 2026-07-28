import type { ReactNode } from "react";
import { saveSiteSettingsAction } from "@/lib/admin-actions";
import { getSiteConfig } from "@/lib/site-config";

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminSettingsPage({ searchParams }: Props) {
  const cfg = getSiteConfig();
  const params = await searchParams;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h1 className="text-3xl font-extrabold text-slate-900">Настройки сайта</h1>
      <p className="mt-1 text-sm text-slate-500">Все параметры сохраняются в серверный файл конфигурации.</p>
      {params.saved ? <p className="mt-2 text-xs text-emerald-600">Изменения сохранены</p> : null}

      <form action={saveSiteSettingsAction} className="mt-5 grid gap-5">
        <Group title="Основное">
          <Input name="siteName" label="Название сайта" defaultValue={cfg.siteName} />
          <Input name="siteDescription" label="Описание сайта" defaultValue={cfg.siteDescription} />
          <Input name="paidAdPriceRub" label="Стоимость платного объявления, ₽" type="number" defaultValue={String(cfg.pricing.paidAdPriceRub)} />
        </Group>

        <Group title="Аватары пользователей">
          <Input name="avatarMaxSizeKb" label="Максимальный размер, КБ" type="number" defaultValue={String(cfg.avatar.maxSizeKb)} />
          <Input name="avatarFormats" label="Разрешённые форматы (через запятую)" defaultValue={cfg.avatar.allowedFormats.join(", ")} />
        </Group>

        <Group title="Объявления">
          <Input name="maxTitleLength" label="Максимальная длина заголовка" type="number" defaultValue={String(cfg.ads.maxTitleLength)} />
          <Input name="maxDescriptionLength" label="Максимальная длина описания" type="number" defaultValue={String(cfg.ads.maxDescriptionLength)} />
          <Input name="maxImageSizeKb" label="Максимальный размер изображения, КБ" type="number" defaultValue={String(cfg.ads.maxImageSizeKb)} />
          <Input name="maxImagesCount" label="Максимум изображений" type="number" defaultValue={String(cfg.ads.maxImagesCount)} />
          <Input name="imageCompressionQuality" label="Качество сжатия изображений" type="number" defaultValue={String(cfg.ads.imageCompressionQuality)} />
        </Group>

        <Group title="ИИ ассистент">
          <div className="grid gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="aiEnabled" defaultChecked={cfg.aiAssistant.enabled} /> Включить ИИ</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="aiAutoModeration" defaultChecked={cfg.aiAssistant.autoModeration} /> Авто-модерация объявлений</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="aiSupportAutoReply" defaultChecked={cfg.aiAssistant.supportAutoReply} /> Автоответы техподдержки</label>
            <Input name="ticketThreshold" label="Порог уверенности для эскалации в тикет (0-1)" defaultValue={String(cfg.aiAssistant.ticketThreshold)} />
          </div>
        </Group>

        <button className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white">Сохранить настройки</button>
      </form>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function Input(props: { name: string; label: string; defaultValue: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm text-slate-600">
      <span>{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.defaultValue}
        className="rounded-xl border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
