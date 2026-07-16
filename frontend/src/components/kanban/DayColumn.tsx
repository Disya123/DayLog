import { useState, FormEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Warning, X } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import {
  formatDayHeader,
  isToday,
  isOverdue,
  toISODate,
} from '@/lib/date-utils';
import { TaskCard } from './TaskCard';
import { daysApi } from '@/api/days';
import { tasksApi } from '@/api/tasks';
import type { Calendar, Day, Task } from '@/api/types';

interface DayColumnProps {
  date: Date;
  calendar: Calendar;
  day: Day | undefined;
  onOpenDay: (day: Day) => void;
  onShowHistory: (taskId: string) => void;
}

export function DayColumn({ date, calendar, day, onOpenDay, onShowHistory }: DayColumnProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const today = isToday(date);
  // Колонка просрочена, если есть хотя бы одна невыполненная задача в прошедшем дне
  const hasOverdueTasks =
    !!day && day.tasks.some((t) => isOverdue(t.done, day.date));

  const { setNodeRef, isOver } = useDroppable({
    id: day?.id ?? `empty-${toISODate(date)}`,
    data: { dayId: day?.id, date },
  });

  // Создать день (если ещё не существует) — нужно перед созданием задачи
  const createDayMutation = useMutation({
    mutationFn: () => daysApi.create(calendar.id, date),
    onSuccess: (newDay) => {
      queryClient.setQueryData<{ days: Day[] }>(['calendar', calendar.id], (old) => {
        if (!old) return old;
        if (old.days.find(d => d.id === newDay.id)) return old;
        return {
          ...old,
          days: [...old.days, { ...newDay, tasks: [] }],
        };
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      let targetDay = day;
      if (!targetDay) {
        targetDay = await createDayMutation.mutateAsync();
      }
      return tasksApi.create(calendar.id, targetDay.id, newTitle);
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData<{ days: Day[] }>(['calendar', calendar.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          days: old.days.map((d) =>
            d.id === newTask.dayId
              ? { ...d, tasks: [...d.tasks, newTask] }
              : d
          ),
        };
      });
      setNewTitle('');
      setAdding(false);
    },
  });

  function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (newTitle.trim()) {
      createTaskMutation.mutate();
    }
  }

  const taskIds = day?.tasks.map((t: Task) => t.id) ?? [];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute inset-x-0 top-0 flex flex-col rounded-2xl border bg-[var(--color-surface-2)] transition-all duration-300',
        'h-[150px] max-h-[150px] overflow-hidden',
        'hover:h-auto hover:max-h-[550px] hover:z-30 hover:shadow-diffuse-lg hover:overflow-y-auto',
        isOver ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent-subtle)]/40' : 'border-[var(--color-border)]',
        today && 'ring-1 ring-inset ring-[var(--color-accent)]/30',
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3.5 pb-3 cursor-pointer"
        onClick={() => day && onOpenDay(day)}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              today ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]',
            )}
          >
            {formatDayHeader(date)}
          </span>
          {hasOverdueTasks && (
            <span className="flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
              <Warning size={11} weight="fill" />
              просрочка
            </span>
          )}
          {day && (
            <span className="text-xs text-[var(--color-text-subtle)]">
              {day.tasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 px-3 pb-3 min-h-[280px] flex-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {day?.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                day={day}
                calendarId={calendar.id}
                onShowHistory={onShowHistory}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {!day && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-6 text-xs text-[var(--color-text-subtle)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] press"
          >
            <Plus size={14} weight="bold" />
            Добавить задачу
          </button>
        )}

        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddTask}
            className="flex flex-col gap-2"
          >
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddTask(e as unknown as FormEvent);
                }
                if (e.key === 'Escape') {
                  setAdding(false);
                  setNewTitle('');
                }
              }}
              placeholder="Название задачи…"
              rows={2}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none focus:border-[var(--color-accent)] resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!newTitle.trim() || createTaskMutation.isPending}
                className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 press"
              >
                {createTaskMutation.isPending ? 'Добавление…' : 'Добавить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setNewTitle('');
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
              >
                <X size={14} />
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {/* Footer — кнопка добавления, если день уже есть */}
      {day && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] border-t border-[var(--color-border)] transition-colors"
        >
          <Plus size={13} weight="bold" />
          Новая задача
        </button>
      )}
    </div>
  );
}
