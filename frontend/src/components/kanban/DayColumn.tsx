import { useState, FormEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Warning, X } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
        'flex-1 min-w-0 flex flex-col rounded-2xl border transition-all duration-700 ease-[cubic-bezier(0.25,0.6,0.25,1)]',
        'min-h-[148px] overflow-hidden',
        !day ? 'bg-[#fafbfc] dark:bg-[var(--color-surface-2)]/30' : 'bg-[var(--color-surface-2)]',
        'group-hover/week:[flex-grow:0.62] group-focus-within/week:[flex-grow:0.62]',
        'hover:![flex-grow:2.3] focus-within:![flex-grow:2.3] hover:bg-[var(--color-surface)] hover:shadow-xl hover:border-[var(--color-accent)]/40',
        isOver ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent-subtle)]/40' : 'border-[var(--color-border)]',
        today && 'ring-1 ring-inset ring-[var(--color-accent)]/30',
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3.5 pb-3 cursor-pointer whitespace-nowrap"
        onClick={() => day && onOpenDay(day)}
      >
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-semibold", today ? "text-[var(--color-accent)]" : "text-[var(--color-text)]")}>
            {format(date, 'E,', { locale: ru })}
          </span>
          <span className={cn("text-sm", today ? "text-[var(--color-accent)]" : "text-[var(--color-text-subtle)]")}>
            {format(date, 'd MMM', { locale: ru })}
          </span>
        </div>
        
        {/* Stat badges */}
        <div className="flex gap-1.5 ml-auto">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Warning size={10} weight="bold" />
              просрочка
            </span>
          )}
          {day && day.tasks.length > 0 && (
            <span className="text-xs font-medium text-[var(--color-text-subtle)]">
              {day.tasks.filter((t) => t.done).length} / {day.tasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 px-3 pb-3 flex-1 overflow-hidden">
        {day ? (
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {day.tasks.map((task) => (
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
        ) : (
          <div className="flex-1 flex flex-col justify-center mt-1">
            <button
              className="flex-1 flex items-center justify-center gap-2 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/50 transition-colors min-h-[44px] whitespace-nowrap cursor-default"
            >
              <Plus size={14} weight="bold" />
              <span className="text-xs font-medium">Добавить задачу</span>
            </button>
          </div>
        )}

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
