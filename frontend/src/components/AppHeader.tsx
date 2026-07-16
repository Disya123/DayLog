import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, SignOut, ListChecks } from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';

export function AppHeader() {
  const navigate = useNavigate();
  const { actor, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <Link
          to="/calendars"
          className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-[var(--color-text)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <CheckSquare size={16} weight="bold" className="text-white" />
          </span>
          DayLog
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <ListChecks size={16} weight="duotone" />
            <span className="font-medium text-[var(--color-text)]">
              {actor?.name}
            </span>
            {actor?.type === 'guest' && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                гость
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <SignOut size={16} weight="bold" />
            Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
