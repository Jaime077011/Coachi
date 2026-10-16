"use client";

import { api } from "@coachi/core";
import type { ClientDetails, ClientFile, GymInput } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { GymEditor, GymSummary, toGymInput } from "@/components/coachi/gym-editor";
import { ScreenPanel } from "@/components/coachi/screen-panel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/hooks/use-can";
import { Link, useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

type Key = keyof ClientDetails;
type FieldDef =
  | { key: Key; label: string; kind: "number"; unit?: "cm" | "kg" }
  | { key: Key; label: string; kind: "text" | "longtext" }
  | { key: Key; label: string; kind: "enum"; options: { value: string; label: string }[] }
  | { key: Key; label: string; kind: "days" | "list" | "bool" };

export function FileTab({ clientId, data }: { clientId: string; data: ClientFile }) {
  const t = useTranslations("clientFile");
  const tIntake = useTranslations("intake");
  const tGym = useTranslations("gym");
  const opt = (values: readonly string[], prefix: string) =>
    values.map((v) => ({ value: v, label: tIntake(`${prefix}${v}` as Parameters<typeof tIntake>[0]) }));

  const sections: { id: string; title: string; fields: FieldDef[] }[] = [
    {
      id: "profile",
      title: t("profile"),
      fields: [
        { key: "age", label: t("f_age"), kind: "number" },
        { key: "gender", label: t("f_gender"), kind: "enum", options: [{ value: "male", label: tIntake("male") }, { value: "female", label: tIntake("female") }] },
        { key: "height_cm", label: t("f_height"), kind: "number", unit: "cm" },
        { key: "start_weight_kg", label: t("f_startWeight"), kind: "number", unit: "kg" },
        { key: "job", label: t("f_job"), kind: "text" },
        { key: "activity", label: t("f_activity"), kind: "enum", options: opt(["sedentary", "light", "moderate", "active", "very_active"], "activity_") },
        { key: "training_days", label: t("f_days"), kind: "days" },
        { key: "training_time", label: t("f_time"), kind: "text" },
        { key: "place", label: t("f_place"), kind: "enum", options: [{ value: "gym", label: tIntake("placeGym") }, { value: "home", label: tIntake("placeHome") }, { value: "both", label: tIntake("placeBoth") }] },
        { key: "equipment", label: t("f_equipment"), kind: "list" },
      ],
    },
    {
      id: "health",
      title: t("health"),
      fields: [
        { key: "injuries", label: t("f_injuries"), kind: "longtext" },
        { key: "pain_areas", label: t("f_pain"), kind: "list" },
        { key: "health_notes", label: t("f_health"), kind: "longtext" },
        { key: "medicines", label: t("f_medicines"), kind: "longtext" },
        { key: "past_training", label: t("f_past"), kind: "longtext" },
        { key: "sports", label: t("f_sports"), kind: "text" },
      ],
    },
    {
      id: "food",
      title: t("food"),
      fields: [
        { key: "food_likes", label: t("f_likes"), kind: "longtext" },
        { key: "food_dislikes", label: t("f_dislikes"), kind: "longtext" },
        { key: "food_never", label: t("f_never"), kind: "longtext" },
        { key: "meals_per_day", label: t("f_meals"), kind: "number" },
        { key: "budget", label: t("f_budget"), kind: "enum", options: opt(["low", "medium", "high"], "budget_") },
        { key: "cooks_at_home", label: t("f_cooks"), kind: "bool" },
        { key: "water_liters", label: t("f_water"), kind: "number" },
        { key: "supplements", label: t("f_supplements"), kind: "text" },
      ],
    },
  ];

  return (
    <Accordion type="multiple" defaultValue={["profile"]}>
      {sections.map((s) => (
        <AccordionItem key={s.id} value={s.id} className="mb-3 rounded-lg border bg-card px-4 last:border-b">
          <AccordionTrigger className="text-[17px] font-semibold hover:no-underline">{s.title}</AccordionTrigger>
          <AccordionContent>
            <Section clientId={clientId} details={data.details} fields={s.fields} />
          </AccordionContent>
        </AccordionItem>
      ))}
      <AccordionItem value="gym" className="mb-3 rounded-lg border bg-card px-4 last:border-b">
        <AccordionTrigger className="text-[17px] font-semibold hover:no-underline">{tGym("coachTitle")}</AccordionTrigger>
        <AccordionContent>
          <GymSection clientId={clientId} gym={data.gym} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Section({ clientId, details, fields }: { clientId: string; details: ClientDetails | null; fields: FieldDef[] }) {
  const t = useTranslations("clientFile");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const canEdit = useCan()("client_edit");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Record<Key, string>>>({});

  const save = useMutation({
    mutationFn: () => {
      const patch: Partial<ClientDetails> = {};
      for (const f of fields) {
        const raw = draft[f.key];
        if (raw === undefined) continue;
        const value =
          f.kind === "number" ? (raw.trim() === "" ? null : Number(raw.replace(",", ".")))
          : f.kind === "days" || f.kind === "list" ? raw.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
          : f.kind === "bool" ? raw === "yes"
          : raw.trim() || null;
        (patch as Record<string, unknown>)[f.key] = f.kind === "days" ? (value as string[]).map(Number).filter((n) => !Number.isNaN(n)) : value;
      }
      return api.clients.updateDetails(clientId, patch);
    },
    onSuccess: () => {
      setEditing(false);
      setDraft({});
      toast.success(t("savedToast"));
      void queryClient.invalidateQueries({ queryKey: qk.clientFile(clientId) });
    },
  });

  if (!details) return <p className="text-sm text-hint">{t("notFilled")}</p>;

  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-4">
        {fields.map((f) =>
          editing ? (
            <EditField key={f.key} field={f} value={details[f.key]} draft={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
          ) : (
            <div key={f.key} className="flex flex-col gap-0.5">
              <dt className="text-xs text-hint">{f.label}</dt>
              <dd className="text-[15px]">
                <ReadValue field={f} value={details[f.key]} />
              </dd>
            </div>
          ),
        )}
      </dl>
      {canEdit && (
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
                {save.isPending && <Loader2Icon className="animate-spin" />}
                {t("saveEdit")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => (setEditing(false), setDraft({}))}>
                {tCommon("cancel")}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <PencilIcon data-icon="inline-start" />
              {t("edit")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** What his gym has, as he listed it. The coach can fix it on its own screen (same editor as the client's My gym). */
function GymSection({ clientId, gym }: { clientId: string; gym: ClientFile["gym"] }) {
  const t = useTranslations("gym");
  const canEdit = useCan()("client_edit");
  return (
    <div className="flex flex-col gap-4">
      {gym && gym.items.length + gym.custom_items.length > 0 ? <GymSummary gym={gym} /> : <p className="text-sm text-hint">{t("notListed")}</p>}
      {canEdit && (
        <div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/coach/clients/${clientId}/gym`}>
              <PencilIcon data-icon="inline-start" />
              {t("edit")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/** /coach/clients/<id>/gym */
export function EditClientGym({ clientId }: { clientId: string }) {
  const t = useTranslations("gym");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const back = `/coach/clients/${clientId}?tab=file`;
  const gym = useQuery({ queryKey: qk.clientGym(clientId), queryFn: () => api.clients.gym(clientId) });
  const [draft, setDraft] = useState<GymInput | null>(null);
  const value = draft ?? (gym.isSuccess ? toGymInput(gym.data) : null);
  const save = useMutation({
    mutationFn: (input: GymInput) => api.clients.saveGym(clientId, input),
    onSuccess: () => {
      toast.success(tCommon("saved"));
      void queryClient.invalidateQueries({ queryKey: qk.clientFile(clientId) });
      void queryClient.invalidateQueries({ queryKey: qk.clientGym(clientId) });
      router.push(back);
    },
  });
  return (
    <ScreenPanel
      back={back}
      title={t("editTitle")}
      footer={
        <Button disabled={!value || save.isPending} onClick={() => value && save.mutate(value)}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {tCommon("save")}
        </Button>
      }
    >
      {value && <GymEditor value={value} onChange={setDraft} />}
    </ScreenPanel>
  );
}

function ReadValue({ field, value }: { field: FieldDef; value: unknown }) {
  const t = useTranslations("clientFile");
  const fmt = useFmt();
  const empty = <span className="text-hint">{t("notFilled")}</span>;
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return empty;
  switch (field.kind) {
    case "number":
      return <span className="tabular-nums">{field.unit === "cm" ? fmt.cm(value as number) : field.unit === "kg" ? fmt.kg(value as number) : fmt.num(value as number)}</span>;
    case "enum":
      return <>{field.options.find((o) => o.value === value)?.label ?? String(value)}</>;
    case "bool":
      return <>{value ? t("yes") : t("no")}</>;
    case "days":
      return <>{(value as number[]).map((d) => fmt.weekday(`2026-10-${String(11 + d).padStart(2, "0")}`)).join(" · ")}</>;
    case "list":
      return <>{(value as string[]).join("، ")}</>;
    default:
      return <span className="whitespace-pre-line">{String(value)}</span>;
  }
}

function EditField({
  field,
  value,
  draft,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  draft: string | undefined;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("clientFile");
  const id = `f-${field.key}`;
  const initial =
    value === null || value === undefined ? "" : Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "yes" : "no") : String(value);
  const current = draft ?? initial;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {field.label}
      </Label>
      {field.kind === "enum" || field.kind === "bool" ? (
        <Select value={current} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-12 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.kind === "enum" ? field.options : [{ value: "yes", label: t("yes") }, { value: "no", label: t("no") }]).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.kind === "longtext" ? (
        <Textarea id={id} value={current} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input
          id={id}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          inputMode={field.kind === "number" ? "decimal" : undefined}
          dir={field.kind === "number" || field.kind === "days" ? "ltr" : undefined}
        />
      )}
    </div>
  );
}
