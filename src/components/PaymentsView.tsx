import { useMemo, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Landmark,
  Layers,
  Pencil,
  Plus,
  QrCode,
  Trash2,
} from 'lucide-react';
import {
  Expense,
  PaymentBreakdownItem,
  PaymentMethod,
} from '../types/finance';
import {
  CATEGORY_MAP,
  PAYMENT_METHOD_MAP,
  formatBRL,
  formatMonthLabel,
} from '../utils/finance';

interface PaymentsViewProps {
  selectedMonth: string;
  monthExpenses: Expense[];
  paymentBreakdown: PaymentBreakdownItem[];
  onOpenNewModal: (defaultMethod?: PaymentMethod) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

const METHOD_ICONS: Record<PaymentMethod, typeof QrCode> = {
  pix: QrCode,
  credito: CreditCard,
  debito: Landmark,
  dinheiro: Banknote,
};

function InstallmentBadge({ expense }: { expense: Expense }) {
  if (!expense.installmentTotal || !expense.installmentCurrent) return null;
  const isLast = expense.installmentCurrent === expense.installmentTotal;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium tabular-nums-mono whitespace-nowrap border ${
        isLast
          ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300'
          : 'bg-sky-500/12 border-sky-500/30 text-sky-300'
      }`}
    >
      <Layers className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      <span>
        {expense.installmentCurrent}/{expense.installmentTotal}
      </span>
    </span>
  );
}

export function PaymentsView({
  selectedMonth,
  monthExpenses,
  paymentBreakdown,
  onOpenNewModal,
  onEdit,
  onDelete,
}: PaymentsViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | 'all'>('all');

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  );

  const filteredExpenses = useMemo(() => {
    const base =
      selectedMethod === 'all'
        ? monthExpenses
        : monthExpenses.filter((e) => e.paymentMethod === selectedMethod);

    return [...base].sort((a, b) => {
      if (b.day !== a.day) return b.day - a.day;
      return b.amount - a.amount;
    });
  }, [monthExpenses, selectedMethod]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-50">
            Formas de Pagamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gastos de {formatMonthLabel(selectedMonth)} por Pix, Crédito, Débito e Dinheiro
          </p>
        </div>
        {selectedMethod !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedMethod('all')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 self-start sm:self-auto whitespace-nowrap transition-colors py-1"
          >
            Mostrar todas as formas
          </button>
        )}
      </div>

      {/* 2x2 on iPhone 14, 4-Column on Desktop */}
      <section
        aria-label="Totais por forma de pagamento"
        className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4"
      >
        {paymentBreakdown.map((item) => {
          const Icon = METHOD_ICONS[item.method];
          const isSelected = selectedMethod === item.method;
          return (
            <button
              key={item.method}
              type="button"
              onClick={() =>
                setSelectedMethod(isSelected ? 'all' : item.method)
              }
              aria-pressed={isSelected}
              data-testid={`payment-card-${item.method}`}
              className={`text-left rounded-xl border p-3.5 sm:p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                isSelected
                  ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-500/[0.12] via-[#11161F] to-[#11161F]'
                  : 'border-white/[0.08] bg-[#11161F] hover:border-white/[0.16] hover:bg-[#141A24]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-300">
                  <span
                    className="h-2 w-2 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </span>
                <Icon
                  className="h-4 w-4 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
              </div>

              <p
                data-testid={`payment-total-${item.method}`}
                className="mt-2.5 sm:mt-3 text-lg sm:text-2xl font-semibold tracking-tight text-slate-50 tabular-nums-mono truncate"
              >
                {formatBRL(item.total)}
              </p>

              <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="tabular-nums-mono text-slate-300">
                  {item.share.toFixed(1).replace('.', ',')}%
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {item.count} {item.count === 1 ? 'item' : 'itens'}
                </span>
              </p>
            </button>
          );
        })}
      </section>

      {/* Visual Share Bar */}
      <section
        aria-label="Proporção das formas de pagamento"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Composição do mês
          </h2>
          <span className="text-xs text-slate-400">
            Total:{' '}
            <strong className="tabular-nums-mono text-slate-200 font-semibold">
              {formatBRL(monthTotal)}
            </strong>
          </span>
        </div>

        {monthTotal === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Sem lançamentos neste mês para calcular a proporção.
          </p>
        ) : (
          <>
            <div className="h-3 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
              {paymentBreakdown
                .filter((p) => p.total > 0)
                .map((p) => (
                  <div
                    key={p.method}
                    style={{
                      width: `${p.share}%`,
                      backgroundColor: p.color,
                    }}
                    title={`${p.label}: ${formatBRL(p.total)} (${p.share}%)`}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                  />
                ))}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06] text-xs">
              {paymentBreakdown.map((item) => (
                <div key={item.method} className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span
                      className="h-2 w-2 rounded-xs shrink-0"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 tabular-nums-mono truncate">
                    Fix {formatBRL(item.fixedTotal)} · Var {formatBRL(item.variableTotal)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Filtered Ledger */}
      <section
        aria-label="Despesas filtradas por forma de pagamento"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] overflow-hidden"
      >
        <div className="px-4 sm:px-5 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {selectedMethod === 'all'
                ? `Lançamentos de ${formatMonthLabel(selectedMonth)}`
                : `Pagamentos via ${PAYMENT_METHOD_MAP[selectedMethod].label}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Toque nos cartões acima para filtrar por forma de pagamento
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onOpenNewModal(selectedMethod === 'all' ? undefined : selectedMethod)
            }
            className="min-h-[40px] inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-100 transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>
              {selectedMethod === 'all'
                ? 'Nova despesa'
                : `Adicionar em ${PAYMENT_METHOD_MAP[selectedMethod].label}`}
            </span>
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-200">
              {selectedMethod === 'all'
                ? `Nenhuma despesa registrada em ${formatMonthLabel(selectedMonth).toLowerCase()}.`
                : `Nenhum gasto em ${PAYMENT_METHOD_MAP[selectedMethod].label} neste mês.`}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Registre uma nova despesa ou selecione outra forma de pagamento acima.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-xs font-medium text-slate-400">
                    <th className="py-3 pl-5 pr-3 font-medium">Despesa</th>
                    <th className="py-3 px-3 font-medium">Pagamento</th>
                    <th className="py-3 px-3 font-medium">Categoria</th>
                    <th className="py-3 px-3 font-medium">Dia</th>
                    <th className="py-3 px-3 font-medium text-right">Valor</th>
                    <th className="py-3 pl-3 pr-5 font-medium text-right w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-sm">
                  {filteredExpenses.map((exp) => {
                    const cat = CATEGORY_MAP[exp.category] ?? CATEGORY_MAP.outros;
                    const pm =
                      PAYMENT_METHOD_MAP[exp.paymentMethod] ??
                      PAYMENT_METHOD_MAP.pix;
                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-100">{exp.name}</p>
                            <InstallmentBadge expense={exp} />
                          </div>
                          {exp.note && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                              {exp.note}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-200 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-xs shrink-0"
                              style={{ backgroundColor: pm.color }}
                              aria-hidden="true"
                            />
                            <span>{pm.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                          {cat.label}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-400 tabular-nums-mono whitespace-nowrap">
                          Dia {String(exp.day).padStart(2, '0')}
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
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.07] transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(exp)}
                              aria-label={`Excluir ${exp.name}`}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
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
                    <td colSpan={4} className="py-3 pl-5 pr-3 text-xs text-slate-400">
                      {filteredExpenses.length}{' '}
                      {filteredExpenses.length === 1 ? 'lançamento' : 'lançamentos'}
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-semibold text-emerald-300 tabular-nums-mono">
                      {formatBRL(filteredTotal)}
                    </td>
                    <td className="py-3 pl-3 pr-5" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Stacked Cards (iPhone 14) */}
            <ul className="md:hidden divide-y divide-white/[0.06]">
              {filteredExpenses.map((exp) => {
                const cat = CATEGORY_MAP[exp.category] ?? CATEGORY_MAP.outros;
                const pm =
                  PAYMENT_METHOD_MAP[exp.paymentMethod] ?? PAYMENT_METHOD_MAP.pix;
                return (
                  <li
                    key={exp.id}
                    className="px-4 py-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {exp.name}
                        </p>
                        <InstallmentBadge expense={exp} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5 text-slate-200">
                          <span
                            className="h-2 w-2 rounded-xs shrink-0"
                            style={{ backgroundColor: pm.color }}
                            aria-hidden="true"
                          />
                          {pm.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{cat.label}</span>
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
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-slate-100 tabular-nums-mono">
                        {formatBRL(exp.amount)}
                      </span>
                      <div className="flex items-center gap-0.5 -mr-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(exp)}
                          aria-label={`Editar ${exp.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.07]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(exp)}
                          aria-label={`Excluir ${exp.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
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
    </div>
  );
}
