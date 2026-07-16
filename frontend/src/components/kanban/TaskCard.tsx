import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Check, DotsSixVertical, Trash, PencilSimple, Clock } from '@phosphor-icons/react';
import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { isOverdue } from '@/lib/date-utils';
import { tasksApi } from '@/api/tasks';
import type { Task, Day } from '@/api/types';

interface TaskCardProps {
  task: Task;
  day: Day;
  calendarId: string;
  onShowHistory: (taskId: string) => void;
}

export function TaskCard({ task, day, calendarId, onShowHistory }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  const overdue = isOverdue(task.done, day.date);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { dayId: day.id, task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const toggleMutation = useMutation({
    mutationFn: (done: boolean) => tasksApi.update(task.id, { done }),
    onMutate: async (done) => {
      await queryClient.cancelQueries({ queryKey: ['calendar', calendarId] });
      const previousCalendar = queryClient.getQueryData(['calendar', calendarId]);
      queryClient.setQueryData<{ days: Day[] }>(['calendar', calendarId], (old) => {
        if (!old) return old;
        return {
          ...old,
          days: old.days.map((d) =>
            d.id === day.id
              ? { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, done } : t)) }
              : d,
          ),
        };
      });
      return { previousCalendar };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousCalendar) {
        queryClient.setQueryData(['calendar', calendarId], context.previousCalendar);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] });
    },
  });

  const titleMutation = useMutation({
    mutationFn: (title: string) => tasksApi.update(task.id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', calendarId] });
    },
  });

  function saveTitle() {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) {
      titleMutation.mutate(trimmed);
    } else {
      setEditing(false);
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn(
        'group relative flex items-start gap-2.5 rounded-xl border bg-[var(--color-surface)] p-3',
        'transition-shadow',
        isDragging ? 'shadow-diffuse-lg border-[var(--color-accent)]/40 z-50' : 'border-[var(--color-border)]',
        overdue && 'border-amber-300/60 bg-amber-50/30',
      )}
    >
      {/* Drag handle */}
      <button
        className="mt-0.5 cursor-grab text-[var(--color-text-subtle)] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Перетащить задачу"
      >
        <DotsSixVertical size={16} />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => toggleMutation.mutate(!task.done)}
        className={cn(
          'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-colors press',
          task.done
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
            : 'border-[var(--color-border-strong)] hover:border-[var(--color-accent)]',
        )}
        style={{ height: 18, width: 18 }}
        aria-label={task.done ? 'Снять отметку' : 'Отметить выполненной'}
      >
        {task.done && <Check size={12} weight="bold" className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setDraftTitle(task.title);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-[var(--color-accent)] bg-[var(--color-surface)] px-1.5 py-0.5 text-sm text-[var(--color-text)] outline-none"
          />
        ) : (
          <p
            onDoubleClick={() => setEditing(true)}
            className={cn(
              'text-sm leading-snug break-words',
              task.done && 'text-done',
              !task.done && overdue && 'text-overdue',
              !task.done && !overdue && 'text-[var(--color-text)]',
            )}
          >
            {task.title}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 bg-[var(--color-surface)] shadow-sm rounded-lg border border-[var(--color-border)] p-0.5">
        <button
          onClick={() => onShowHistory(task.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
          title="История"
        >
          <Clock size={13} />
        </button>
        <button
          onClick={() => {
            setDraftTitle(task.title);
            setEditing(true);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
          title="Редактировать"
        >
          <PencilSimple size={13} />
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
          title="Удалить"
        >
          <Trash size={13} />
        </button>
      </div>
    </motion.div>
  );
}
