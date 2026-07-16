import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, CircleNotch, Check } from '@phosphor-icons/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { formatDayHeader, isOverdue } from '@/lib/date-utils';
import { daysApi } from '@/api/days';
import { TaskCard } from '@/components/kanban/TaskCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Calendar, Day } from '@/api/types';

interface DayPanelProps {
  day: Day;
  calendar: Calendar;
  onClose: () => void;
  onShowHistory: (taskId: string) => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

export function DayPanel({ day, calendar, onShowHistory, onClose }: DayPanelProps) {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: day.description || undefined,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[180px] px-4 py-3 outline-none focus:outline-none text-[var(--color-text)] leading-relaxed',
        'data-placeholder': 'Опишите, что произошло в этот день…',
      },
    },
    onUpdate: ({ editor }) => {
      setSaveState('saving');
      const json = editor.getJSON();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveMutation.mutate(json);
      }, 800);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (description: unknown) => daysApi.update(day.id, { description }),
    onMutate: () => setSaveState('saving'),
    onSuccess: () => {
      setSaveState('saved');
      queryClient.invalidateQueries({ queryKey: ['calendar', calendar.id] });
      setTimeout(() => setSaveState('idle'), 1500);
    },
    onError: () => setSaveState('idle'),
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        className="flex w-full max-w-2xl flex-col bg-[var(--color-surface)] shadow-diffuse-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium tracking-tight text-[var(--color-text)]">
              {formatDayHeader(new Date(day.date))}
            </h2>
            {day.tasks.some((t) => isOverdue(t.done, day.date)) && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                есть просрочка
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] press"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Rich-text описание */}
          <div className="border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                Описание дня
              </span>
              <SaveIndicator state={saveState} />
            </div>
            <div className="px-6 pb-5">
              {editor && <EditorContent editor={editor} />}
              {!editor && (
                <div className="h-[180px] animate-pulse rounded-lg bg-[var(--color-surface-2)]" />
              )}
            </div>
          </div>

          {/* Задачи */}
          <div className="px-6 py-5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)] mb-3 block">
              Задачи ({day.tasks.length})
            </span>
            <SortableContext
              items={day.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {day.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    day={day}
                    calendarId={calendar.id}
                    onShowHistory={onShowHistory}
                  />
                ))}
              </div>
            </SortableContext>
            {day.tasks.length === 0 && (
              <p className="text-sm text-[var(--color-text-subtle)] py-6 text-center">
                В этот день ещё нет задач.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {state === 'saving' && (
        <>
          <CircleNotch size={12} className="animate-spin text-[var(--color-text-subtle)]" />
          <span className="text-[var(--color-text-subtle)]">Сохранение…</span>
        </>
      )}
      {state === 'saved' && (
        <>
          <Check size={12} weight="bold" className="text-[var(--color-accent)]" />
          <span className="text-[var(--color-accent)]">Сохранено</span>
        </>
      )}
    </div>
  );
}
