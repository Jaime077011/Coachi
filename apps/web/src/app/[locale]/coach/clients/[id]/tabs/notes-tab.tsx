"use client";

import { api } from "@coachi/core";
import { noteTag, type CoachNote, type NoteTag } from "@coachi/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeOffIcon, NotebookPenIcon, PinIcon, PinOffIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/coachi/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-can";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

/** Private to the coach. Pinned notes on top, then newest first. */
export function NotesTab({ clientId, notes }: { clientId: string; notes: CoachNote[] }) {
  const t = useTranslations("clientFile");
  const tCommon = useTranslations("common");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const canEdit = useCan()("client_edit");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [pinned, setPinned] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const refresh = () => void queryClient.invalidateQueries({ queryKey: qk.clientFile(clientId) });

  const add = useMutation({
    mutationFn: () => api.clients.addNote({ client_id: clientId, text: text.trim(), tags, pinned }),
    onSuccess: () => {
      setText("");
      setTags([]);
      setPinned(false);
      refresh();
    },
  });
  const togglePin = useMutation({
    mutationFn: (note: CoachNote) => api.clients.updateNote(note.id, { pinned: !note.pinned }),
    onSuccess: refresh,
  });

  /** Undo instead of "Are you sure?": hide now, delete after 6 seconds unless undone. */
  const remove = (note: CoachNote) => {
    setHidden((h) => [...h, note.id]);
    const timer = setTimeout(() => {
      timers.current.delete(note.id);
      void api.clients.deleteNote(note.id).then(refresh);
    }, 6000);
    timers.current.set(note.id, timer);
    toast(t("noteDeleted"), {
      duration: 6000,
      action: {
        label: tCommon("undo"),
        onClick: () => {
          clearTimeout(timers.current.get(note.id));
          timers.current.delete(note.id);
          setHidden((h) => h.filter((id) => id !== note.id));
        },
      },
    });
  };

  const visible = notes.filter((n) => !hidden.includes(n.id));

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-hint">
        <EyeOffIcon className="size-4" aria-hidden />
        {t("onlyYou")}
      </p>
      {canEdit && (
        <form
          className="flex flex-col gap-3 rounded-lg border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) add.mutate();
          }}
        >
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("notePlaceholder")} aria-label={t("addNote")} />
          <div className="flex flex-wrap items-center gap-2">
            {noteTag.options.map((tag) => (
              <Toggle
                key={tag}
                size="sm"
                pressed={tags.includes(tag)}
                onPressedChange={(on) => setTags((ts) => (on ? [...ts, tag] : ts.filter((x) => x !== tag)))}
                className="h-9 rounded-full border px-3 data-[state=on]:border-primary data-[state=on]:bg-primary/12 data-[state=on]:text-primary"
              >
                {t(`tag_${tag}`)}
              </Toggle>
            ))}
            <Toggle size="sm" pressed={pinned} onPressedChange={setPinned} className="h-9 gap-1 rounded-full border px-3 data-[state=on]:text-primary">
              <PinIcon className="size-4" aria-hidden />
              {t("pin")}
            </Toggle>
            <Button type="submit" size="sm" className="ms-auto" disabled={!text.trim() || add.isPending}>
              {t("addNote")}
            </Button>
          </div>
        </form>
      )}

      {visible.length === 0 ? (
        <EmptyState icon={NotebookPenIcon} title={t("noNotes")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((n) => (
            <li key={n.id}>
              <Card className={cn(n.pinned && "border-primary/40")}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {n.pinned && (
                      <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                        <PinIcon aria-hidden />
                        {t("pinned")}
                      </Badge>
                    )}
                    {n.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {t(`tag_${tag}`)}
                      </Badge>
                    ))}
                    <span className="ms-auto text-xs text-hint">{fmt.relative(n.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-line">{n.text}</p>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => togglePin.mutate(n)}>
                        {n.pinned ? <PinOffIcon data-icon="inline-start" /> : <PinIcon data-icon="inline-start" />}
                        {n.pinned ? t("unpin") : t("pin")}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(n)}>
                        <Trash2Icon data-icon="inline-start" />
                        {t("deleteNote")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
