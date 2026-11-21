import { FormEvent, useMemo, useState } from 'react';
import {
  Copy,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseType } from '../types/finance';
import {
  CATEGORIES,
  CATEGORY_MAP,
  formatBRL,
  formatMonthLabel,
  formatMonthNameLower,
  parseBRLInput,
} from '../utils/finance';

type SortOption = 'day-desc' | 'amount-desc' | 'name-asc';

interface ExpenseLedgerProps {
  selectedMonth: string;
  previousMonth: string;
  previousMonthFixedCount: number;
  expenses: Expense[];
  selectedCategory: ExpenseCategory | 'all';
  onSelectCategory: (cat: ExpenseCategory | 'all') => void;
  onQuickAdd: (payload: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    type: ExpenseType;
  }) => void;
  onOpenNewModal: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onClonePreviousFixed: () => void;
}

export function ExpenseLedger({
  selectedMonth,
  previousMonth,
  previousMonthFixedCount,
  expenses,
  selectedCategory,
  onSelectCategory,
  onQuickAdd,
  onOpenNewModal,
  onEdit,
  onDelete,
  onClonePreviousFixed,
}: ExpenseLedgerProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('day-desc');

  // Inline quick-add state
  const [quickName, setQuickName] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState<ExpenseCategory>('alimentacao');
  const [quickType, setQuickType] = useState<ExpenseType>('variavel');
  const [quickError, setQuickError] = useState<string | null>(null);

  const presentCategories = useMemo(() => {
    const ids = new Set(expenses.map((e) => e.category));
    return CATEGORIES.filter((c) => ids.has(c.id));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = expenses.filter((exp) => {
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        exp.name.toLowerCase().includes(q) ||
        (exp.note && exp.note.toLowerCase().includes(q)) ||
        CATEGORY_MAP[exp.category].label.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'pt-BR');
      // day-desc
      if (b.day !== a.day) return b.day - a.day;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [expenses, search, selectedCategory, sortBy]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const handleQuickSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = quickName.trim();
    if (!trimmed) {
      setQuickError('Digite o nome da despesa.');
      return;
    }
    const parsed = parseBRLInput(quickAmount);
    if (parsed === null) {
      setQuickError('Digite um valor válido (ex.: 45,90).');
      return;
    }

    onQuickAdd({
      name: trimmed,
      amount: parsed,
      category: quickCategory,
      type: quickType,
    });
    setQuickName('');
    setQuickAmount('');
    setQuickError(null);
  };

  const prevMonthLower = formatMonthNameLower(previousMonth);

  return (
    <section
      aria-label="Lista de despesas do mês"
      className="rounded-xl border border-white/[0.08] bg-[#11161F] overflow-hidden"
    >
      {/* Header + Quick Add Composer */}
      <div className="p-5 border-b border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Despesas de {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro rápido direto na tabela ou adicione detalhes completos em Nova despesa
            </p>
          </div>
          {previousMonthFixedCount > 0 && (
            <button
              type="button"
              onClick={onClonePreviousFixed}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
            >
              <Copy className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Copiar fixas de {prevMonthLower}</span>
            </button>
          )}
        </div>

        {/* Inline Fast Expense Form */}
        <form
          onSubmit={handleQuickSubmit}
          aria-label="Adicionar despesa rápida"
          className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end"
          noValidate
        >
          <div className="md:col-span-4">
            <label
              htmlFor="quick-expense-name"
              className="block text-[11px] font-medium text-slate-400 mb-1"
            >
              Despesa
            </label>
            <input
              id="quick-expense-name"
              type="text"
              value={quickName}
              onChange={(e) => {
                setQuickName(e.target.value);
                if (quickError) setQuickError(null);
              }}
              placeholder="Ex.: Mercado, Conta de luz..."
              className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="quick-expense-amount"
              className="block text-[11px] font-medium text-slate-400 mb-1"
            >
              Valor (R$)
            </label>
            <input
              id="quick-expense-amount"
              type="text"
              inputMode="decimal"
              value={quickAmount}
              onChange={(e) => {
                setQuickAmount(e.target.value);
                if (quickError) setQuickError(null);
              }}
              placeholder="0,00"
              className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3 text-sm text-slate-100 tabular-nums-mono placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="quick-expense-category"
              className="block text-[11px] font-medium text-slate-400 mb-1"
            >
              Categoria
            </label>
            <select
              id="quick-expense-category"
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as ExpenseCategory)}
              className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#0A0D12] px-2.5 text-sm text-slate-100 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#11161F]">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="quick-expense-type"
              className="block text-[11px] font-medium text-slate-400 mb-1"
            >
              Tipo
            </label>
            <select
              id="quick-expense-type"
              value={quickType}
              onChange={(e) => setQuickType(e.target.value as ExpenseType)}
              className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#0A0D12] px-2.5 text-sm text-slate-100 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="variavel" className="bg-[#11161F]">
                Variável
              </option>
              <option value="fixa" className="bg-[#11161F]">
                Fixa
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#04130D] text-sm font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              <span>Adicionar</span>
            </button>
          </div>
        </form>

        {quickError && (
          <p role="alert" className="text-xs text-rose-300">
            {quickError}
          </p>
        )}
      </div>

      {/* Filter & Search Bar */}
      {expenses.length > 0 && (
        <div className="px-5 py-3.5 border-b border-white/[0.06] bg-[#0E131B] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-white/[0.1] text-slate-50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              Todas ({expenses.length})
            </button>
            {presentCategories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(active ? 'all' : cat.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white/[0.1] text-slate-50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar despesas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar despesa..."
                className="w-full sm:w-52 h-9 rounded-lg border border-white/[0.08] bg-[#0A0D12] pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none"
              />
            </div>

            <select
              aria-label="Ordenar despesas"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-lg border border-white/[0.08] bg-[#0A0D12] px-2.5 text-xs text-slate-300 focus:border-emerald-500/60 focus:outline-none"
            >
              <option value="day-desc" className="bg-[#11161F]">
                Mais recentes
              </option>
              <option value="amount-desc" className="bg-[#11161F]">
                Maior valor
              </option>
              <option value="name-asc" className="bg-[#11161F]">
                Nome (A–Z)
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Content: Empty State vs Ledger */}
      {expenses.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-100">
            Nenhuma despesa em {formatMonthLabel(selectedMonth).toLowerCase()}
          </p>
          <p className="mt-1.5 text-sm text-slate-400 max-w-md mx-auto">
            Use o campo rápido acima para registrar seu primeiro gasto deste mês ou traga suas contas fixas do mês anterior.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-[#04130D] text-sm font-semibold transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              <span>Adicionar primeira despesa</span>
            </button>
            {previousMonthFixedCount > 0 && (
              <button
                type="button"
                onClick={onClonePreviousFixed}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.07] text-sm font-medium text-slate-200 transition-colors whitespace-nowrap"
              >
                <Copy className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span>
                  Copiar {previousMonthFixedCount} fixas de {prevMonthLower}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-slate-300">
            Nenhuma despesa encontrada para o filtro atual.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onSelectCategory('all');
            }}
            className="mt-3 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Limpar busca e filtros
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs font-medium text-slate-400">
                  <th className="py-3 pl-5 pr-3 font-medium">Despesa</th>
                  <th className="py-3 px-3 font-medium">Categoria</th>
                  <th className="py-3 px-3 font-medium">Tipo e Dia</th>
                  <th className="py-3 px-3 font-medium text-right">Valor</th>
                  <th className="py-3 pl-3 pr-5 font-medium text-right w-24">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {filteredExpenses.map((exp) => {
                  const cat = CATEGORY_MAP[exp.category] ?? CATEGORY_MAP.outros;
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-white/[0.025] transition-colors group"
                    >
                      <td className="py-3.5 pl-5 pr-3">
                        <p className="font-medium text-slate-100">{exp.name}</p>
                        {exp.note && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                            {exp.note}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-xs shrink-0"
                            style={{ backgroundColor: cat.color }}
                            aria-hidden="true"
                          />
                          <span>{cat.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                        <span>{exp.type === 'fixa' ? 'Fixa' : 'Variável'}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums-mono">
                          Dia {String(exp.day).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-100 tabular-nums-mono whitespace-nowrap">
                        {formatBRL(exp.amount)}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(exp)}
                            aria-label={`Editar ${exp.name}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(exp.id)}
                            aria-label={`Excluir ${exp.name}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.08] bg-[#0D121A]">
                  <td
                    colSpan={3}
                    className="py-3 pl-5 pr-3 text-xs text-slate-400"
                  >
                    Exibindo {filteredExpenses.length} de {expenses.length}{' '}
                    {expenses.length === 1 ? 'despesa' : 'despesas'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-semibold text-emerald-300 tabular-nums-mono">
                    {formatBRL(filteredTotal)}
                  </td>
                  <td className="py-3 pl-3 pr-5" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Stacked List */}
          <ul className="md:hidden divide-y divide-white/[0.06]">
            {filteredExpenses.map((exp) => {
              const cat = CATEGORY_MAP[exp.category] ?? CATEGORY_MAP.outros;
              return (
                <li key={exp.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {exp.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5 text-slate-300">
                        <span
                          className="h-2 w-2 rounded-xs shrink-0"
                          style={{ backgroundColor: cat.color }}
                          aria-hidden="true"
                        />
                        {cat.label}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{exp.type === 'fixa' ? 'Fixa' : 'Variável'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums-mono">
                        Dia {String(exp.day).padStart(2, '0')}
                      </span>
                    </div>
                    {exp.note && (
                      <p className="mt-1 text-xs text-slate-500 truncate">
                        {exp.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-semibold text-slate-100 tabular-nums-mono">
                      {formatBRL(exp.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(exp)}
                        aria-label={`Editar ${exp.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.07]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(exp.id)}
                        aria-label={`Excluir ${exp.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
            <li className="px-4 py-3 bg-[#0D121A] flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Subtotal ({filteredExpenses.length})
              </span>
              <span className="text-sm font-semibold text-emerald-300 tabular-nums-mono">
                {formatBRL(filteredTotal)}
              </span>
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
