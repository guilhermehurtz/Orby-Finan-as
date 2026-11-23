import {
  CalendarRange,
  CreditCard,
  Database,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { ActiveTab, MonthSummary } from '../types/finance';
import { formatBRL, formatMonthLabel } from '../utils/finance';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  recentMonths: MonthSummary[];
  monthlyGoal: number | null;
  currentMonthTotal: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'history', label: 'Histórico Mensal', icon: CalendarRange },
  { id: 'data', label: 'Dados e Backup', icon: Database },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  selectedMonth,
  onSelectMonth,
  recentMonths,
  monthlyGoal,
  currentMonthTotal,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const goalPercent =
    monthlyGoal && monthlyGoal > 0
      ? Math.min(100, Math.round((currentMonthTotal / monthlyGoal) * 100))
      : null;
  const isOverGoal = Boolean(monthlyGoal && currentMonthTotal > monthlyGoal);

  const navContent = (
    <div className="flex h-full flex-col bg-[#0D1117] border-r border-white/[0.07]">
      {/* Official Orby Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.07] shrink-0">
        <button
          type="button"
          onClick={() => {
            onSelectTab('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
        >
          <span className="h-9 w-9 rounded-[10px] overflow-hidden ring-1 ring-white/15 shrink-0 bg-[#0B1F4D] shadow-sm">
            <img
              src="/assets/aistudio/favicon_2deb01cd.jpg"
              alt="Logo orby"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover scale-[1.26]"
            />
          </span>
          <span className="text-[21px] font-bold tracking-tight text-slate-50 font-[var(--font-display)] lowercase leading-none whitespace-nowrap">
            orby
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar menu de navegação"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Navegação principal" className="px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/[0.16] to-teal-500/[0.06] text-emerald-300 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Months Switcher */}
      <div className="px-4 pt-3 pb-4 flex-1 overflow-y-auto border-t border-white/[0.06]">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <span className="text-xs font-medium text-slate-400">Meses com registros</span>
          <span className="text-xs text-slate-500 tabular-nums-mono">
            {recentMonths.length}
          </span>
        </div>

        {recentMonths.length === 0 ? (
          <p className="px-2 py-3 text-xs text-slate-500 leading-relaxed">
            Nenhum mês registrado ainda. Adicione sua primeira despesa para iniciar o histórico.
          </p>
        ) : (
          <ul className="space-y-1">
            {recentMonths.slice(0, 8).map((item) => {
              const isSelected =
                (activeTab === 'overview' || activeTab === 'payments') &&
                item.month === selectedMonth;
              return (
                <li key={item.month}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMonth(item.month);
                      if (activeTab !== 'payments') {
                        onSelectTab('overview');
                      }
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isSelected
                        ? 'bg-white/[0.07] text-slate-100 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="truncate">{formatMonthLabel(item.month)}</span>
                    <span className="tabular-nums-mono text-slate-300 shrink-0">
                      {formatBRL(item.total)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Monthly Goal Summary Footer */}
      {monthlyGoal && monthlyGoal > 0 && (
        <div className="p-4 border-t border-white/[0.07] shrink-0">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <span className="text-xs text-slate-400">Meta do mês</span>
            <span
              className={`text-xs tabular-nums-mono font-medium ${
                isOverGoal ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {goalPercent}%
            </span>
          </div>
          <div
            className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden"
            role="progressbar"
            aria-valuenow={goalPercent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso em relação à meta mensal"
          >
            <div
              className={`h-full rounded-full transition-transform duration-300 origin-left ${
                isOverGoal
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 tabular-nums-mono">
            <span>{formatBRL(currentMonthTotal)}</span>
            <span>/ {formatBRL(monthlyGoal)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}
