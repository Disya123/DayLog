import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  ArrowRight,
  Plus,
  Trash,
  PencilSimple,
  Clock,
} from '@phosphor-icons/react';
import { tasksApi } from '@/api/tasks';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AuditLog } from '@/api/types';

interface AuditModalProps {
  taskId: string;
  calendarId: string;
  onClose: () => void;
}

const actionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: {
    label: 'Создана',
    icon: <Plus size={14} weight="bold" />,
    color: 'text-emerald-600 bg-emerald-50',
  },
  status_changed: {
    label: 'Статус изменён',
    icon: <CheckCircle size={14} weight="bold" />,
    color: 'text-blue-600 bg-blue-50',
  },
  moved: {
    label: 'Перенесена',
    icon: <ArrowRight size={14} weight="bold" />,
    color: 'text-amber-600 bg-amber-50',
  },
  title_changed: {
    label: 'Переименована',
    icon: <PencilSimple size={14} weight="bold" />,
    color: 'text-zinc-600 bg-zinc-100',
  },
  deleted: {
    label: 'Удалена',
    icon: <Trash size={14} weight="bold" />,
    color: 'text-rose-600 bg-rose-50',
  },
};

export function AuditModal({ taskId, calendarId, onClose }: AuditModalProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit', calendarId, taskId],
    queryFn: () => tasksApi.audit(calendarId, taskId),
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-diffuse-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
              <Clock size={18} weight="duotone" />
            </span>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)]">История задачи</h3>
              <p className="text-xs text-[var(--color-text-subtle)]">
                Кто и когда менял статус или переносил
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] press"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="relative flex flex-col gap-1">
              {logs.map((log: AuditLog, i: number) => {
                const info = actionLabels[log.action] ?? {
                  label: log.action,
                  icon: <Clock size={14} />,
                  color: 'text-zinc-600 bg-zinc-100',
                };
                return (
                  <div key={log.id} className="relative flex gap-3 pb-4">
                    {/* Timeline line */}
                    {i < logs.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--color-border)]" />
                    )}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${info.color}`}
                    >
                      {info.icon}
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          {info.label}
                        </span>
                        {log.action === 'status_changed' && log.meta != null && (
                          <span className="text-xs text-[var(--color-text-subtle)]">
                            {(() => {
                              const m = log.meta as { from?: boolean; to?: boolean };
                              return `${m.from ? 'выполнена' : 'невыполнена'} → ${m.to ? 'выполнена' : 'невыполнена'}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {log.actorName}{' '}
                        {log.actorType === 'guest' && (
                          <span className="text-amber-600">(гость)</span>
                        )}{' '}
                        · {formatRelative(log.createdAt)}
                      </p>
                      {log.action === 'moved' && log.fromDayId && log.toDayId && (
                        <p className="text-xs text-[var(--color-text-subtle)] mt-1 font-mono">
                          {log.fromDayId.slice(0, 8)} → {log.toDayId.slice(0, 8)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-subtle)] py-8 text-center">
              История пуста.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
