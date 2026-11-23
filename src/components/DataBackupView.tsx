import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  HardDrive,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { FinanceStoreData } from '../types/finance';
import { formatBRL, parseBRLInput, validateBackupPayload } from '../utils/finance';
import { getStorageByteSize } from '../utils/storage';

interface DataBackupViewProps {
  store: FinanceStoreData;
  monthsCount: number;
  onUpdateGoal: (goal: number | null) => void;
  onImportStore: (data: FinanceStoreData) => void;
  onRestoreDemo: () => void;
  onClearAll: () => void;
}

export function DataBackupView({
  store,
  monthsCount,
  onUpdateGoal,
  onImportStore,
  onRestoreDemo,
  onClearAll,
}: DataBackupViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [goalInput, setGoalInput] = useState(
    store.monthlyGoal ? store.monthlyGoal.toFixed(2).replace('.', ',') : ''
  );
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const bytes = getStorageByteSize();
  const kbLabel = `${Math.max(0.1, bytes / 1024).toFixed(1).replace('.', ',')} KB`;

  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = goalInput.trim();
    if (!trimmed) {
      onUpdateGoal(null);
      setGoalFeedback('Meta mensal removida.');
      return;
    }
    const parsed = parseBRLInput(trimmed);
    if (parsed === null) {
      setGoalFeedback('Informe um valor válido maior que zero.');
      return;
    }
    onUpdateGoal(parsed);
    setGoalFeedback(`Meta mensal atualizada para ${formatBRL(parsed)}.`);
  };

  const handleExport = () => {
    const payload: FinanceStoreData = {
      version: 1,
      expenses: store.expenses,
      monthlyGoal: store.monthlyGoal ?? null,
      seeded: false,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orby-backup-${today}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setImportStatus({
      type: 'success',
      message: `Backup exportado com ${store.expenses.length} despesas.`,
    });
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validated = validateBackupPayload(parsed);
        if (!validated.ok) {
          setImportStatus({ type: 'error', message: validated.error });
          return;
        }
        onImportStore(validated.data);
        setGoalInput(
          validated.data.monthlyGoal
            ? validated.data.monthlyGoal.toFixed(2).replace('.', ',')
            : ''
        );
        setImportStatus({
          type: 'success',
          message: `Backup importado com sucesso (${validated.data.expenses.length} despesas carregadas).`,
        });
      } catch {
        setImportStatus({
          type: 'error',
          message: 'Não foi possível ler o arquivo JSON. Verifique o formato.',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl overflow-hidden ring-1 ring-white/15 bg-[#EAF4FF] shrink-0 shadow-md">
          <img
            src="/assets/aistudio/Orby_app_icon_and_logo_35b50344_2K_8e4087db.jpg"
            alt="Logo oficial orby"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover scale-[1.06]"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            Dados e Backup Local
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Seus registros do orby ficam salvos automaticamente no navegador (localStorage) — ideal para hospedar de graça no Netlify sem servidor ou login.
          </p>
        </div>
      </div>

      {/* Storage Overview */}
      <section
        aria-label="Resumo da memória local"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
            <HardDrive className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-100">
              Memória ativa neste navegador
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Toda despesa adicionada, editada ou excluída é gravada instantaneamente no armazenamento local do seu navegador. Se você trocar de dispositivo ou limpar os dados do navegador, use o backup JSON abaixo para restaurar seu histórico em segundos.
            </p>
            <div className="mt-4 pt-4 border-t border-white/[0.07] grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-400">Despesas salvas</p>
                <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums-mono">
                  {store.expenses.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Meses no histórico</p>
                <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums-mono">
                  {monthsCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Espaço usado</p>
                <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums-mono">
                  {kbLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Goal Config */}
      <section
        aria-label="Meta mensal de gastos"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
      >
        <h2 className="text-base font-semibold text-slate-100">
          Meta mensal de gastos
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Defina um teto mensal opcional para acompanhar seu progresso na barra lateral.
        </p>

        <form
          onSubmit={handleSaveGoal}
          className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="sm:w-64">
            <label
              htmlFor="monthly-goal-input"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Valor da meta (R$)
            </label>
            <input
              id="monthly-goal-input"
              type="text"
              inputMode="decimal"
              value={goalInput}
              onChange={(e) => {
                setGoalInput(e.target.value);
                if (goalFeedback) setGoalFeedback(null);
              }}
              placeholder="Ex.: 3800,00"
              className="w-full h-10 rounded-lg border border-white/[0.1] bg-[#0A0D12] px-3.5 text-sm text-slate-100 tabular-nums-mono placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-[#04130D] text-sm font-semibold transition-all whitespace-nowrap"
          >
            Salvar meta
          </button>
        </form>

        {goalFeedback && (
          <p className="mt-2.5 text-xs text-emerald-300">{goalFeedback}</p>
        )}
      </section>

      {/* Export / Import */}
      <section
        aria-label="Exportar e importar backup"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5 space-y-4"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Exportar e importar backup (.json)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Guarde uma cópia de segurança dos seus meses ou leve seus dados do computador para o celular.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] text-sm font-medium text-slate-100 transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Exportar backup JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1] text-sm font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            <Upload className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <span>Importar backup JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            aria-label="Selecionar arquivo de backup JSON"
            className="hidden"
          />
        </div>

        {importStatus && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
              importStatus.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/25 bg-rose-500/10 text-rose-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{importStatus.message}</span>
          </div>
        )}
      </section>

      {/* Reset / Clear Actions */}
      <section
        aria-label="Reiniciar dados"
        className="rounded-xl border border-white/[0.08] bg-[#11161F] p-5"
      >
        <h2 className="text-base font-semibold text-slate-100">
          Gerenciar base inicial
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Comece sua planilha do zero removendo os exemplos, ou restaure o conjunto de demonstração quando quiser testar gráficos.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] hover:bg-rose-500/[0.15] text-xs font-medium text-rose-200 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Limpar todos os dados</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
              <span className="text-xs text-rose-200">
                Apagar todas as {store.expenses.length} despesas?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                  setImportStatus({
                    type: 'success',
                    message: 'Todos os registros foram removidos. Você está começando do zero.',
                  });
                }}
                className="px-3 py-1 rounded-md bg-rose-500 text-white text-xs font-semibold hover:bg-rose-400 transition-colors"
              >
                Confirmar limpeza
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 rounded-md text-xs text-slate-300 hover:text-slate-100"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onRestoreDemo();
              setConfirmClear(false);
              setImportStatus({
                type: 'success',
                message: 'Dados de exemplo restaurados com sucesso.',
              });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-slate-300 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Restaurar dados de exemplo</span>
          </button>
        </div>
      </section>
    </div>
  );
}
