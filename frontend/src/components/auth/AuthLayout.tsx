import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckSquare, CalendarDots, ShareNetwork } from '@phosphor-icons/react';

/**
 * Split-screen auth layout: форма слева, продуктовая панель справа.
 * По design-taste-frontend: asymmetric (не centered), Zinc база, Emerald акцент.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1fr_1fr]">
      {/* Левая половина — форма */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--color-text)] mb-12"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]">
              <CheckSquare size={18} weight="bold" className="text-white" />
            </span>
            DayLog
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] leading-none">
              {title}
            </h1>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed max-w-[52ch]">
              {subtitle}
            </p>
          </motion.div>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-sm text-[var(--color-text-muted)]">{footer}</div>
        </div>
      </div>

      {/* Правая половина — продуктовая панель */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-[#18181b] px-16 py-20">
        {/* Фоновое свечение — subtle, не neon */}
        <div
          className="absolute -top-1/4 -right-1/4 h-[60vh] w-[60vh] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: 'var(--color-accent)' }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 h-[50vh] w-[50vh] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'var(--color-accent)' }}
        />

        <div className="relative z-10">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-accent)]">
            Рабочий календарь
          </p>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white leading-[1.1] max-w-[24ch]">
            Дневник задач для отчётности перед руководством.
          </h2>
          <p className="mt-5 text-base text-zinc-400 leading-relaxed max-w-[48ch]">
            Создавайте календари, ведите описание каждого дня, отмечайте задачи
            выполненными и делитесь доступом с коллегами.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <FeatureRow
            icon={<CalendarDots size={22} weight="duotone" />}
            title="Недельный kanban"
            description="Семь дней перед глазами, задачи перетаскиваются между колонками."
          />
          <FeatureRow
            icon={<CheckSquare size={22} weight="duotone" />}
            title="Просрочка видна сразу"
            description="Невыполненные задачи в прошедших днях подсвечиваются жёлтым."
          />
          <FeatureRow
            icon={<ShareNetwork size={22} weight="duotone" />}
            title="Share-ссылки"
            description="Приглашённые по ссылке могут редактировать наравне с владельцем."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--color-accent)] ring-1 ring-inset ring-white/10">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
