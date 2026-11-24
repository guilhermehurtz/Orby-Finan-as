import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { firebaseProjectId, firestoreDatabaseId } from '../firebase';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isQuotaError = this.state.errorMessage
      .toLowerCase()
      .includes('quota exceeded');

    const isReadQuotaMetric = this.state.errorMessage.includes(
      'Free daily read units per project (free tier database)'
    );

    const upgradeUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/firestore/databases/${firestoreDatabaseId}/data?openUpgradeDialog=true`;

    return (
      <div className="min-h-dvh bg-[#0A0D12] text-slate-100 flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#11161F] p-6 space-y-4 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold text-slate-50">
              {isQuotaError
                ? 'Limite diário do banco atingido'
                : 'Algo saiu do esperado'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isQuotaError
                ? 'O limite gratuito diário do Firestore foi atingido e será renovado amanhã.'
                : 'Não foi possível concluir a comunicação com o banco de dados na nuvem. Recarregue o aplicativo para tentar novamente.'}
            </p>
          </div>

          {isReadQuotaMetric && (
            <a
              href={upgradeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              Ver limites do banco no Firebase Console
            </a>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-[#04130D] text-sm font-semibold transition-all"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Recarregar Orby</span>
          </button>
        </div>
      </div>
    );
  }
}
