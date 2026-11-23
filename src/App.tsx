import { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  LayoutDashboard,
  Menu,
  Plus,
} from 'lucide-react';
import {
  ActiveTab,
  Expense,
  ExpenseCategory,
  FinanceStoreData,
  InstallmentActionScope,
  PaymentMethod,
} from './types/finance';
import {
  cloneFixedExpensesToMonth,
  createInstallmentExpenses,
  daysInMonth,
  formatMonthLabel,
  formatMonthShort,
  getAllRecordedMonths,
  getCategoryBreakdown,
  getCurrentMonthKey,
  getHistoricalStats,
  getMonthComparison,
  getMonthExpenses,
  getMonthSummary,
  getPaymentMethodBreakdown,
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
import { ExpenseLedger, QuickAddPayload } from './components/ExpenseLedger';
import { ExpenseFormModal, ExpenseFormValues } from './components/ExpenseFormModal';
import { InstallmentDeleteDialog } from './components/InstallmentDeleteDialog';
import { PaymentsView } from './components/PaymentsView';
import { HistoryView } from './components/HistoryView';
import { DataBackupView } from './components/DataBackupView';

const MOBILE_BOTTOM_TABS: {
  id: ActiveTab;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'overview', label: 'Início', icon: LayoutDashboard },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'history', label: 'Histórico', icon: CalendarRange },
  { id: 'data', label: 'Dados', icon: Database },
];

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

  // Modal & delete confirmation state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [modalDefaultPayment, setModalDefaultPayment] =
    useState<PaymentMethod>('pix');
  const [pendingDeleteInstallment, setPendingDeleteInstallment] =
    useState<Expense | null>(null);

  // Transient user feedback banner
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Persist to localStorage whenever store changes
  useEffect(() => {
    saveFinanceStore(store);
  }, [store]);

  // Clear category filter when switching months
  useEffect(() => {
    setSelectedCategory('all');
  }, [selectedMonth]);

  // Reset scroll to top when switching views (especially via mobile bottom bar)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // Auto-dismiss transient feedback notice
  useEffect(() => {
    if (!feedbackNotice) return;
    const t = window.setTimeout(() => setFeedbackNotice(null), 4500);
    return () => window.clearTimeout(t);
  }, [feedbackNotice]);

  const currentRealMonth = useMemo(() => getCurrentMonthKey(), []);

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
        (e) =>
          e.month === previousMonth &&
          e.type === 'fixa' &&
          !e.installmentGroupId
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
    () => getHistoricalStats(store.expenses, currentRealMonth),
    [store.expenses, currentRealMonth]
  );

  const breakdown = useMemo(
    () => getCategoryBreakdown(monthExpenses),
    [monthExpenses]
  );

  const paymentBreakdown = useMemo(
    () => getPaymentMethodBreakdown(monthExpenses),
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
    if (existingId) {
      setStore((prev) => {
        const target = prev.expenses.find((e) => e.id === existingId);
        const shouldUpdateFuture =
          values.editScope === 'future' &&
          Boolean(target?.installmentGroupId) &&
          typeof target?.installmentCurrent === 'number';

        return {
          ...prev,
          seeded: false,
          expenses: prev.expenses.map((item) => {
            if (item.id === existingId) {
              return {
                ...item,
                name: values.name,
                amount: values.amount,
                category: values.category,
                type: values.type,
                paymentMethod: values.paymentMethod,
                month: values.month,
                day: values.day,
                note: values.note,
              };
            }

            if (
              shouldUpdateFuture &&
              item.installmentGroupId === target?.installmentGroupId &&
              typeof item.installmentCurrent === 'number' &&
              item.installmentCurrent > (target?.installmentCurrent ?? 0)
            ) {
              return {
                ...item,
                name: values.name,
                amount: values.amount,
                category: values.category,
                type: values.type,
                paymentMethod: values.paymentMethod,
                day: Math.min(values.day, daysInMonth(item.month)),
                note: values.note,
              };
            }

            return item;
          }),
        };
      });

      if (values.month !== selectedMonth) {
        setSelectedMonth(values.month);
      }
      if (activeTab !== 'payments') {
        setActiveTab('overview');
      }
      return;
    }

    // Creating new installment purchase
    if (
      values.isInstallment &&
      values.installmentsCount &&
      values.installmentsCount >= 2
    ) {
      const groupId = `inst-${generateExpenseId()}`;
      const createdList = createInstallmentExpenses(
        {
          name: values.name,
          amount: values.amount,
          amountMode: values.installmentAmountMode ?? 'total',
          category: values.category,
          type: values.type,
          paymentMethod: values.paymentMethod,
          startMonth: values.month,
          day: values.day,
          note: values.note,
          installmentsCount: values.installmentsCount,
          startingInstallment: values.startingInstallment ?? 1,
          groupId,
        },
        generateExpenseId
      );

      setStore((prev) => ({
        ...prev,
        seeded: false,
        expenses: [...createdList, ...prev.expenses],
      }));

      const lastMonth = createdList[createdList.length - 1]?.month ?? values.month;
      setFeedbackNotice(
        `Compra "${values.name}" parcelada em ${createdList.length}x (${formatMonthShort(
          values.month
        )} até ${formatMonthShort(lastMonth)}).`
      );
    } else {
      const created: Expense = {
        id: generateExpenseId(),
        name: values.name,
        amount: values.amount,
        category: values.category,
        type: values.type,
        paymentMethod: values.paymentMethod,
        month: values.month,
        day: values.day,
        note: values.note,
        createdAt: new Date().toISOString(),
      };

      setStore((prev) => ({
        ...prev,
        seeded: false,
        expenses: [created, ...prev.expenses],
      }));
    }

    if (values.month !== selectedMonth) {
      setSelectedMonth(values.month);
    }
    if (activeTab !== 'payments') {
      setActiveTab('overview');
    }
  };

  const handleQuickAdd = (payload: QuickAddPayload) => {
    const targetMonth = payload.month ?? selectedMonth;
    const day = payload.day ?? new Date().getDate();

    if (payload.installments && payload.installments >= 2) {
      const groupId = `inst-${generateExpenseId()}`;
      const createdList = createInstallmentExpenses(
        {
          name: payload.name,
          amount: payload.amount,
          amountMode: payload.installmentAmountMode ?? 'total',
          category: payload.category,
          type: payload.type,
          paymentMethod: payload.paymentMethod,
          startMonth: targetMonth,
          day,
          installmentsCount: payload.installments,
          startingInstallment: 1,
          groupId,
        },
        generateExpenseId
      );

      setStore((prev) => ({
        ...prev,
        seeded: false,
        expenses: [...createdList, ...prev.expenses],
      }));

      if (targetMonth !== selectedMonth) {
        setSelectedMonth(targetMonth);
      }

      const lastMonth = createdList[createdList.length - 1]?.month ?? targetMonth;
      setFeedbackNotice(
        `Compra "${payload.name}" lançada em ${createdList.length}x (${formatMonthShort(
          targetMonth
        )} até ${formatMonthShort(lastMonth)}).`
      );
      return;
    }

    const created: Expense = {
      id: generateExpenseId(),
      name: payload.name,
      amount: payload.amount,
      category: payload.category,
      type: payload.type,
      paymentMethod: payload.paymentMethod,
      month: targetMonth,
      day,
      createdAt: new Date().toISOString(),
    };

    setStore((prev) => ({
      ...prev,
      seeded: false,
      expenses: [created, ...prev.expenses],
    }));

    if (targetMonth !== selectedMonth) {
      setSelectedMonth(targetMonth);
      setFeedbackNotice(
        `Despesa "${payload.name}" adicionada em ${formatMonthLabel(targetMonth)}.`
      );
    }
  };

  const handleRequestDeleteExpense = (expense: Expense) => {
    if (expense.installmentGroupId && expense.installmentTotal) {
      setPendingDeleteInstallment(expense);
      return;
    }

    setStore((prev) => ({
      ...prev,
      seeded: false,
      expenses: prev.expenses.filter((e) => e.id !== expense.id),
    }));
  };

  const handleConfirmDeleteInstallment = (
    expense: Expense,
    scope: InstallmentActionScope
  ) => {
    setStore((prev) => {
      const nextExpenses = prev.expenses.filter((item) => {
        if (scope === 'single') {
          return item.id !== expense.id;
        }
        if (scope === 'all') {
          return item.installmentGroupId !== expense.installmentGroupId;
        }
        // scope === 'future': remove this installment and any later installments in the group
        if (item.installmentGroupId !== expense.installmentGroupId) {
          return true;
        }
        const curr = item.installmentCurrent ?? 0;
        const targetCurr = expense.installmentCurrent ?? 0;
        return curr < targetCurr;
      });

      return {
        ...prev,
        seeded: false,
        expenses: nextExpenses,
      };
    });

    setPendingDeleteInstallment(null);

    if (scope === 'all') {
      setFeedbackNotice(
        `Todas as parcelas de "${expense.name}" foram removidas.`
      );
    } else if (scope === 'future') {
      setFeedbackNotice(
        `Parcela ${expense.installmentCurrent}/${expense.installmentTotal} e próximas de "${expense.name}" removidas.`
      );
    }
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

  const handleOpenNewModal = (defaultMethod: PaymentMethod = 'pix') => {
    setEditingExpense(null);
    setModalDefaultPayment(defaultMethod);
    setModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const showMonthSwitcher = activeTab === 'overview' || activeTab === 'payments';

  return (
    <div className="min-h-dvh bg-[#0A0D12] text-slate-100 flex">
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
        <header className="sticky top-0 z-30 safe-top border-b border-white/[0.07] bg-[#0A0D12]/90 backdrop-blur-md">
          <div className="h-14 sm:h-16 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu de meses e meta"
                className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.05] hover:text-slate-100 transition-colors"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                aria-label="Ir para o início do Orby"
                className="lg:hidden h-8 w-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
              >
                <img
                  src="/assets/aistudio/favicon_1_b76ee16a.png"
                  alt="Orby"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain scale-[1.12]"
                />
              </button>

              {showMonthSwitcher ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
                    aria-label="Mês anterior"
                    className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#11161F] text-slate-300 hover:text-slate-100 hover:bg-white/[0.07] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <span
                    data-testid="active-month-label"
                    className="px-1 sm:px-3 text-sm sm:text-base font-semibold text-slate-100 font-[var(--font-display)] whitespace-nowrap"
                  >
                    <span className="sm:hidden">
                      {formatMonthShort(selectedMonth)}
                    </span>
                    <span className="hidden sm:inline">
                      {formatMonthLabel(selectedMonth)}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
                    aria-label="Próximo mês"
                    className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#11161F] text-slate-300 hover:text-slate-100 hover:bg-white/[0.07] transition-colors"
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
              onClick={() => handleOpenNewModal()}
              aria-label="Nova despesa"
              className="min-h-[38px] sm:min-h-[36px] inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-[#04130D] text-xs sm:text-sm font-semibold transition-all shadow-sm whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              <span className="sm:hidden">Nova</span>
              <span className="hidden sm:inline">Nova despesa</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-7 pb-24 lg:pb-8">
          {feedbackNotice && (
            <div
              role="status"
              className="mb-4 sm:mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-200 flex items-center justify-between gap-3"
            >
              <span>{feedbackNotice}</span>
              <button
                type="button"
                onClick={() => setFeedbackNotice(null)}
                className="text-xs text-emerald-300 hover:text-emerald-100 shrink-0 py-1 px-2"
              >
                Fechar
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {store.seeded && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400 pb-0.5">
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
                onOpenNewModal={() => handleOpenNewModal()}
                onEdit={handleOpenEditModal}
                onDelete={handleRequestDeleteExpense}
                onClonePreviousFixed={handleClonePreviousFixed}
              />
            </div>
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              selectedMonth={selectedMonth}
              monthExpenses={monthExpenses}
              paymentBreakdown={paymentBreakdown}
              onOpenNewModal={(defaultMethod) =>
                handleOpenNewModal(defaultMethod)
              }
              onEdit={handleOpenEditModal}
              onDelete={handleRequestDeleteExpense}
            />
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

      {/* Mobile Bottom Navigation Bar (iPhone 14 one-handed ergonomics) */}
      <nav
        aria-label="Navegação inferior"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/[0.08] bg-[#0D1117]/95 backdrop-blur-md safe-bottom"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
          {MOBILE_BOTTOM_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className={`flex h-7 w-11 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-emerald-500/15' : ''
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <ExpenseFormModal
        isOpen={modalOpen}
        defaultMonth={selectedMonth}
        defaultPaymentMethod={modalDefaultPayment}
        editingExpense={editingExpense}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
      />

      <InstallmentDeleteDialog
        expense={pendingDeleteInstallment}
        onCancel={() => setPendingDeleteInstallment(null)}
        onConfirm={handleConfirmDeleteInstallment}
      />
    </div>
  );
}
