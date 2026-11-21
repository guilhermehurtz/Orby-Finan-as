import { FormEvent, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseType } from '../types/finance';
import { CATEGORIES, isValidMonthKey, parseBRLInput } from '../utils/finance';

export interface ExpenseFormValues {
  name: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  month: string;
  day: number;
  note?: string;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  defaultMonth: string;
  editingExpense: Expense | null;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues, existingId?: string) => void;
}

export function ExpenseFormModal({
  isOpen,
  defaultMonth,
  editingExpense,
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('alimentacao');
  const [type, setType] = useState<ExpenseType>('variavel');
  const [month, setMonth] = useState(defaultMonth);
  const [dayText, setDayText] = useState(String(new Date().getDate()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      setName(editingExpense.name);
      setAmountText(editingExpense.amount.toFixed(2).replace('.', ','));
      setCategory(editingExpense.category);
      setType(editingExpense.type);
      setMonth(editingExpense.month);
      setDayText(String(editingExpense.day));
      setNote(editingExpense.note ?? '');
    } else {
      setName('');
      setAmountText('');
      setCategory('alimentacao');
      setType('variavel');
      setMonth(defaultMonth);
      setDayText(String(new Date().getDate()));
      setNote('');
    }
    setError(null);
    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen, editingExpense, defaultMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da despesa.');
      return;
    }

    const parsedAmount = parseBRLInput(amountText);
    if (parsedAmount === null) {
      setError('Informe um valor válido maior que zero (ex.: 149,90).');
      return;
    }

    if (!isValidMonthKey(month)) {
      setError('Selecione um mês de referência válido.');
      return;
    }

    const parsedDay = Number(dayText);
    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setError('Informe um dia entre 1 e 31.');
      return;
    }

    onSubmit(
      {
        name: trimmedName,
        amount: parsedAmount,
        category,
        type,
        month,
        day: parsedDay,
        note: note.trim() || undefined,
      },
      editingExpense?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#11161F] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2
            id="expense-modal-title"
            className="text-base font-semibold text-slate-50"
          >
            {editingExpense ? 'Editar despesa' : 'Nova despesa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="modal-expense-name"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Nome da despesa
            </label>
            <input
              ref={nameInputRef}
              id="modal-expense-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex.: Supermercado, Aluguel, Academia..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-expense-amount"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Valor (R$)
              </label>
              <input
                id="modal-expense-amount"
                type="text"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => {
                  setAmountText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0,00"
                className="w-full rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 tabular-nums-mono placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="modal-expense-category"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Categoria
              </label>
              <select
                id="modal-expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#11161F]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Tipo
              </span>
              <div
                className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0A0D12] border border-white/[0.08]"
                role="group"
                aria-label="Tipo da despesa"
              >
                <button
                  type="button"
                  onClick={() => setType('variavel')}
                  aria-pressed={type === 'variavel'}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'variavel'
                      ? 'bg-white/[0.1] text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Variável
                </button>
                <button
                  type="button"
                  onClick={() => setType('fixa')}
                  aria-pressed={type === 'fixa'}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'fixa'
                      ? 'bg-white/[0.1] text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fixa
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="modal-expense-month"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Mês
              </label>
              <input
                id="modal-expense-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3 py-2 text-sm text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="modal-expense-day"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Dia
              </label>
              <input
                id="modal-expense-day"
                type="number"
                min={1}
                max={31}
                value={dayText}
                onChange={(e) => setDayText(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3 py-2 text-sm text-slate-100 tabular-nums-mono focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-expense-note"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Observação (opcional)
            </label>
            <input
              id="modal-expense-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: Parcela 2/4, pago no débito..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 rounded-lg hover:bg-white/[0.05] transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-[#04130D] rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {editingExpense ? 'Salvar alterações' : 'Salvar despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
