"use client";

import { api } from "@coachi/core";
import type { Checkin, CheckinForm, CheckinQuestion } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheckBigIcon, ClipboardXIcon, Loader2Icon, MessageCircleReplyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldError } from "@/components/coachi/field-error";
import { PhotoSlot } from "@/components/coachi/photo-slot";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

type Answer = string | number | boolean;

function nextDate(dayOfWeek: number) {
  const d = new Date();
  d.setDate(d.getDate() + (((dayOfWeek - d.getDay() + 7) % 7) || 7));
  return d.toISOString();
}

export function CheckinScreen() {
  const t = useTranslations("checkin");
  const { clientId } = useMe();
  const form = useQuery({
    queryKey: qk.checkinForm(clientId),
    queryFn: () => api.checkins.formForClient(clientId),
    enabled: !!clientId,
  });

  return (
    <div className="flex flex-col">
      <ScreenHeader title={t("title")} subtitle={t("intro")} back="/app/today" />
      <QueryState
        query={form}
        isEmpty={(f) => f === null}
        empty={<EmptyState icon={ClipboardXIcon} title={t("noForm")} />}
      >
        {(f) => <CheckinFormView clientId={clientId} form={f!} />}
      </QueryState>
      <History clientId={clientId} />
    </div>
  );
}

function CheckinFormView({ clientId, form }: { clientId: string; form: CheckinForm }) {
  const t = useTranslations("checkin");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [weight, setWeight] = useState("");
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [note, setNote] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  const submit = useMutation({
    mutationFn: () =>
      api.checkins.submit(clientId, {
        answers: form.questions.map((q) => ({ question_id: q.id, value: answers[q.id]! })),
        weight_kg: weight ? Number(weight.replace(",", ".")) : null,
        // Step 4: upload to the private bucket first and send the storage paths.
        photo_paths: photos.filter((p): p is File => !!p).map((p) => `pending/${p.name}`),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.checkins(clientId) });
      void queryClient.invalidateQueries({ queryKey: qk.today(clientId) });
    },
  });

  if (submit.isSuccess) {
    return (
      <EmptyState
        icon={CircleCheckBigIcon}
        title={t("sentTitle")}
        body={t("sentBody", { date: fmt.date(nextDate(form.day_of_week), "long") })}
        className="border-solid border-success/40"
      />
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unanswered = form.questions.filter((q) => answers[q.id] === undefined || answers[q.id] === "").map((q) => q.id);
    setMissing(unanswered);
    if (unanswered.length === 0) submit.mutate();
  };

  const labels = [t("front"), t("side"), t("back")];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {form.questions.map((q) => (
        <Question
          key={q.id}
          question={q}
          value={answers[q.id]}
          error={missing.includes(q.id)}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        />
      ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight">{t("weight")}</Label>
        <Input
          id="weight"
          dir="ltr"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="max-w-40 tabular-nums"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("photos")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {labels.map((label, i) => (
            <PhotoSlot
              key={label}
              label={label}
              file={photos[i] ?? null}
              onChange={(file) => setPhotos((p) => p.map((x, j) => (j === i ? file : x)))}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">{t("note")}</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button type="submit" size="lg" disabled={submit.isPending}>
        {submit.isPending && <Loader2Icon className="animate-spin" />}
        {t("send")}
      </Button>
    </form>
  );
}

function Question({
  question,
  value,
  error,
  onChange,
}: {
  question: CheckinQuestion;
  value: Answer | undefined;
  error: boolean;
  onChange: (value: Answer) => void;
}) {
  const t = useTranslations("checkin");
  const id = `q-${question.id}`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[15px] leading-snug font-semibold">
        {question.text}
      </Label>
      {question.kind === "scale" && (
        <div className="flex items-center gap-4">
          <Slider
            id={id}
            min={1}
            max={10}
            step={1}
            value={[typeof value === "number" ? value : 5]}
            onValueChange={([v]) => onChange(v!)}
            className="flex-1"
          />
          <span className="font-stat w-10 text-center text-3xl tabular-nums">{typeof value === "number" ? value : "–"}</span>
        </div>
      )}
      {question.kind === "text" && (
        <Textarea id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
      )}
      {question.kind === "yes_no" && (
        <ToggleGroup
          id={id}
          type="single"
          variant="outline"
          value={value === true ? "yes" : value === false ? "no" : ""}
          onValueChange={(v) => v && onChange(v === "yes")}
          className="w-full"
        >
          <ToggleGroupItem value="yes" className="h-11 flex-1">
            {t("yes")}
          </ToggleGroupItem>
          <ToggleGroupItem value="no" className="h-11 flex-1">
            {t("no")}
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      {error && <FieldError>{t("required")}</FieldError>}
    </div>
  );
}

function History({ clientId }: { clientId: string }) {
  const t = useTranslations("checkin");
  const fmt = useFmt();
  const list = useQuery({ queryKey: qk.checkins(clientId), queryFn: () => api.checkins.list(clientId), enabled: !!clientId });
  if (!list.data || list.data.length === 0) return null;
  return (
    <section className="mt-10">
      <SectionTitle>{t("history")}</SectionTitle>
      <div className="flex flex-col gap-3">
        {list.data.map((c: Checkin) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{fmt.relative(c.created_at)}</span>
                {c.weight_kg != null && <span className="font-semibold tabular-nums">{fmt.kg(c.weight_kg)}</span>}
              </div>
              {c.note && <p className="text-sm text-muted-foreground">{c.note}</p>}
              {c.coach_reply && (
                <div className="flex gap-2 rounded-md bg-secondary p-3 text-sm">
                  <MessageCircleReplyIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t("coachReply")}</p>
                    <p>{c.coach_reply}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
