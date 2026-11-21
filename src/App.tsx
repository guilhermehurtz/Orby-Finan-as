import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
} from 'lucide-react';
import {
  ActiveTab,
  Expense,
  ExpenseCategory,
  ExpenseType,
  FinanceStoreData,
} from './types/finance';
import {
  cloneFixedExpensesToMonth,
  formatMonthLabel,
  formatMonthShort,
  getAllRecordedMonths,
  getCategoryBreakdown,
  getCurrentMonthKey,
  getHistoricalStats,
  getMonthComparison,
  getMonthExpenses,
  getMonthSummary,
  getTimelineSeries,
  shiftMonth,
} from './utils/finance';
import { buildInitialSeedData } from './utils/seedData';
import {
  generateExpenseId,
  loadFinanceStore,
  saveFinanceStore,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ComparisonBanner } from './components/ComparisonBanner';
import { KpiStrip } from './components/KpiStrip';
import { ChartsSection } from './components/ChartsSection';
import { ExpenseLedger } from './components/ExpenseLedger';
import { ExpenseFormModal, ExpenseFormValues } from './components/ExpenseFormModal';
import { HistoryView } from './components/HistoryView';
import { DataBackupView } from './components/DataBackupView';

export default function App() {
  const [store, setStore] = useState<FinanceStoreData>(() => loadFinanceStore());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthKey()
  );
  const [selectedCategory, setSelectedCategory] = useState<
    ExpenseCategory | 'all'
  >('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Transient user feedback banner (e.g., cloned fixed expenses)
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Persist to localStorage whenever store changes
  useEffect(() => {
    saveFinanceStore(store);
  }, [store]);

  // Clear category filter when switching months
  useEffect(() => {
    setSelectedCategory('all');
  }, [selectedMonth]);

  // Auto-dismiss transient feedback notice
  useEffect(() => {
    if (!feedbackNotice) return;
    const t = window.setTimeout(() => setFeedbackNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackNotice]);

  const previousMonth = useMemo(
    () => shiftMonth(selectedMonth, -1),
    [selectedMonth]
  );

  const monthExpenses = useMemo(
    () => getMonthExpenses(store.expenses, selectedMonth),
    [store.expenses, selectedMonth]
  );

  const previousMonthFixedCount = useMemo(
    () =>
      store.expenses.filter(
        (e) => e.month === previousMonth && e.type === 'fixa'
      ).length,
    [store.expenses, previousMonth]
  );

  const monthSummary = useMemo(
    () => getMonthSummary(store.expenses, selectedMonth),
    [store.expenses, selectedMonth]
  );

  const comparison = useMemo(
    () => getMonthComparison(store.expenses, selectedMonth),
    [store.expenses, selectedMonth]
  );

  const historical = useMemo(
    () => getHistoricalStats(store.expenses),
    [store.expenses]
  );

  const breakdown = useMemo(
    () => getCategoryBreakdown(monthExpenses),
    [monthExpenses]
  );

  const timeline = useMemo(
    () => getTimelineSeries(store.expenses, selectedMonth, 6),
    [store.expenses, selectedMonth]
  );

  const recordedMonthRows = useMemo(
    () => getAllRecordedMonths(store.expenses),
    [store.expenses]
  );

  const recentMonthSummaries = useMemo(
    () => recordedMonthRows.map((r) => r.summary),
    [recordedMonthRows]
  );

  const handleSaveExpense = (values: ExpenseFormValues, existingId?: string) => {
    setStore((prev) => {
      if (existingId) {
        return {
          ...prev,
          seeded: false,
          expenses: prev.expenses.map((item) =>
            item.id === existingId
              ? {
                  ...item,
                  name: values.name,
                  amount: values.amount,
                  category: values.category,
                  type: values.type,
                  month: values.month,
                  day: values.day,
                  note: values.note,
                }
              : item
          ),
        };
      }

      const created: Expense = {
        id: generateExpenseId(),
        name: values.name,
        amount: values.amount,
        category: values.category,
        type: values.type,
        month: values.month,
        day: values.day,
        note: values.note,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        seeded: false,
        expenses: [created, ...prev.expenses],
      };
    });

    if (values.month !== selectedMonth) {
      setSelectedMonth(values.month);
    }
    setActiveTab('overview');
  };

  const handleQuickAdd = (payload: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    type: ExpenseType;
  }) => {
    const created: Expense = {
      id: generateExpenseId(),
      name: payload.name,
      amount: payload.amount,
      category: payload.category,
      type: payload.type,
      month: selectedMonth,
      day: new Date().getDate(),
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      seeded: false,
      expenses: [created, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setStore((prev) => ({
      ...prev,
      seeded: false,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleClonePreviousFixed = () => {
    const cloned = cloneFixedExpensesToMonth(
      store.expenses,
      previousMonth,
      selectedMonth,
      generateExpenseId
    );
    if (cloned.length === 0) {
      setFeedbackNotice(
        'Todas as despesas fixas do mês anterior já estão lançadas neste mês.'
      );
      return;
    }

    setStore((prev) => ({
      ...prev,
      seeded: false,
      expenses: [...cloned, ...prev.expenses],
    }));
    setFeedbackNotice(
      `${cloned.length} ${
        cloned.length === 1 ? 'despesa fixa copiada' : 'despesas fixas copiadas'
      } para ${formatMonthLabel(selectedMonth)}.`
    );
  };

  const handleOpenNewModal = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-100 flex">
      {/* Ambient top subtle glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(16,185,129,0.09),rgba(56,189,248,0.03),transparent)]"
      />

      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        recentMonths={recentMonthSummaries}
        monthlyGoal={store.monthlyGoal ?? null}
        currentMonthTotal={monthSummary.total}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-white/[0.07] bg-[#0A0D12]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {activeTab === 'overview' ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
                  aria-label="Mês anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#11161F] text-slate-300 hover:text-slate-100 hover:bg-white/[0.07] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <span
                  data-testid="active-month-label"
                  className="px-1.5 sm:px-3 text-sm sm:text-base font-semibold text-slate-100 font-[var(--font-display)] whitespace-nowrap"
                >
                  <span className="sm:hidden">{formatMonthShort(selectedMonth)}</span>
                  <span className="hidden sm:inline">
                    {formatMonthLabel(selectedMonth)}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
                  aria-label="Próximo mês"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#11161F] text-slate-300 hover:text-slate-100 hover:bg-white/[0.07] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-semibold text-slate-100 font-[var(--font-display)] truncate">
                {activeTab === 'history' ? 'Histórico Mensal' : 'Dados e Backup'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenNewModal}
            aria-label="Nova despesa"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-[#04130D] text-xs sm:text-sm font-semibold transition-all shadow-sm whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            <span className="sm:hidden">Nova</span>
            <span className="hidden sm:inline">Nova despesa</span>
          </button>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {feedbackNotice && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-200 flex items-center justify-between gap-3"
            >
              <span>{feedbackNotice}</span>
              <button
                type="button"
                onClick={() => setFeedbackNotice(null)}
                className="text-xs text-emerald-300 hover:text-emerald-100 shrink-0"
              >
                Fechar
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {store.seeded && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400 pb-1">
                  <p>
                    Exibindo dados de demonstração para você explorar os gráficos e comparativos.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStore({
                        version: 1,
                        expenses: [],
                        monthlyGoal: null,
                        seeded: false,
                      });
                      setFeedbackNotice(
                        'Dados de exemplo removidos. Comece registrando suas próprias despesas.'
                      );
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium self-start sm:self-auto whitespace-nowrap transition-colors"
                  >
                    Começar do zero
                  </button>
                </div>
              )}

              <ComparisonBanner
                comparison={comparison}
                historicalAverage={historical.average}
                monthsCount={historical.monthsCount}
              />

              <KpiStrip
                summary={monthSummary}
                historical={historical}
                comparison={comparison}
              />

              <ChartsSection
                timeline={timeline}
                historicalAverage={historical.average}
                breakdown={breakdown}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onSelectMonth={setSelectedMonth}
              />

              <ExpenseLedger
                selectedMonth={selectedMonth}
                previousMonth={previousMonth}
                previousMonthFixedCount={previousMonthFixedCount}
                expenses={monthExpenses}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onQuickAdd={handleQuickAdd}
                onOpenNewModal={handleOpenNewModal}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteExpense}
                onClonePreviousFixed={handleClonePreviousFixed}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryView
              rows={recordedMonthRows}
              historical={historical}
              onOpenMonth={(month) => {
                setSelectedMonth(month);
                setActiveTab('overview');
              }}
            />
          )}

          {activeTab === 'data' && (
            <DataBackupView
              store={store}
              monthsCount={historical.monthsCount}
              onUpdateGoal={(goal) =>
                setStore((prev) => ({ ...prev, monthlyGoal: goal }))
              }
              onImportStore={(imported) => {
                setStore(imported);
                if (imported.expenses.length > 0) {
                  const latest = [...imported.expenses]
                    .map((e) => e.month)
                    .sort()
                    .pop();
                  if (latest) setSelectedMonth(latest);
                }
              }}
              onRestoreDemo={() => {
                setStore(buildInitialSeedData());
                setSelectedMonth(getCurrentMonthKey());
              }}
              onClearAll={() => {
                setStore({
                  version: 1,
                  expenses: [],
                  monthlyGoal: null,
                  seeded: false,
                });
              }}
            />
          )}
        </main>
      </div>

      <ExpenseFormModal
        isOpen={modalOpen}
        defaultMonth={selectedMonth}
        editingExpense={editingExpense}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
      />
    </div>
  );
}
