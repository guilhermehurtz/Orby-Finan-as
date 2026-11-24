import { FormEvent, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  CheckCircle2,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from 'lucide-react';
import { auth, firebaseProjectId, googleProvider } from '../firebase';
import {
  FriendlyAuthError,
  mapFirebaseAuthError,
  normalizeUsername,
  usernameToAuthEmail,
  validateRegistrationFields,
  validateUsername,
} from '../utils/authHelpers';

type AuthMode = 'login' | 'register';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [authError, setAuthError] = useState<FriendlyAuthError | null>(null);

  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setAuthError(null);
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (mode === 'register') {
      const validationErr = validateRegistrationFields(
        username,
        password,
        confirmPassword
      );
      if (validationErr) {
        setAuthError({ message: validationErr });
        return;
      }
    } else {
      const userCheck = validateUsername(username);
      if (!userCheck.valid) {
        setAuthError({ message: userCheck.error ?? 'Informe seu usuário.' });
        return;
      }
      if (!password) {
        setAuthError({ message: 'Informe sua senha.' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const authEmail = usernameToAuthEmail(username);
      const cleanUsername = normalizeUsername(username);

      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(
          auth,
          authEmail,
          password
        );
        try {
          await updateProfile(cred.user, { displayName: cleanUsername });
        } catch {
          // Profile displayName update is non-blocking; Firestore profile stores username too
        }
      } else {
        await signInWithEmailAndPassword(auth, authEmail, password);
      }
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const passwordsMatch =
    mode === 'register' &&
    confirmPassword.length > 0 &&
    password === confirmPassword;
  const passwordsMismatch =
    mode === 'register' &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  return (
    <div className="min-h-dvh bg-[#0A0D12] text-slate-100 flex flex-col justify-center px-4 py-8 sm:py-12 relative overflow-hidden safe-top safe-bottom">
      {/* Ambient top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_65%_55%_at_50%_-10%,rgba(16,185,129,0.12),rgba(56,189,248,0.05),transparent)]"
      />

      <div className="relative z-10 w-full max-w-[420px] mx-auto space-y-6">
        {/* Official Orby Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3">
            <span className="h-12 w-12 rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src="/assets/aistudio/favicon_1_b76ee16a.png"
                alt="Logo orby"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain scale-[1.12]"
              />
            </span>
            <span className="text-3xl font-bold tracking-tight text-slate-50 font-[var(--font-display)] lowercase">
              orby
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Entre na sua conta para sincronizar despesas e parcelas em qualquer dispositivo.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-white/[0.09] bg-[#11161F] p-5 sm:p-6 shadow-2xl space-y-5">
          {/* Mode Switcher */}
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0A0D12] border border-white/[0.08]"
            role="tablist"
            aria-label="Alternar entre entrar e criar conta"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`min-h-[40px] rounded-lg text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white/[0.11] text-slate-50 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`min-h-[40px] rounded-lg text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-white/[0.11] text-slate-50 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar conta
            </button>
          </div>

          {authError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-200 space-y-2 leading-relaxed"
            >
              <p>{authError.message}</p>
              {authError.needsEmailPasswordSetup && (
                <a
                  href={firebaseProvidersUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-medium underline underline-offset-4"
                >
                  <span>Abrir Sign-in method no Firebase Console</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="auth-username"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Usuário
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="auth-username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Ex.: guilherme"
                  className="w-full min-h-[46px] rounded-xl border border-white/[0.1] bg-[#0A0D12] pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Mínimo 3 caracteres (letras, números, ponto ou underline)
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    mode === 'register' ? 'new-password' : 'current-password'
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder={
                    mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'
                  }
                  className="w-full min-h-[46px] rounded-xl border border-white/[0.1] bg-[#0A0D12] pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Repetir senha
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Digite a senha novamente"
                    className={`w-full min-h-[46px] rounded-xl border bg-[#0A0D12] pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                      passwordsMismatch
                        ? 'border-rose-500/50 focus:border-rose-500/70 focus:ring-rose-500/20'
                        : passwordsMatch
                          ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                          : 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    aria-label={
                      showConfirm
                        ? 'Ocultar confirmação de senha'
                        : 'Mostrar confirmação de senha'
                    }
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="mt-1 text-[11px] text-rose-300">
                    As senhas digitadas são diferentes.
                  </p>
                )}
                {passwordsMatch && (
                  <p className="mt-1 text-[11px] text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    <span>Senhas iguais</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || googleSubmitting}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-60 text-[#04130D] text-sm font-semibold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>
                    {mode === 'register' ? 'Criando conta...' : 'Entrando...'}
                  </span>
                </>
              ) : (
                <span>{mode === 'register' ? 'Criar conta' : 'Entrar'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-1 border-t border-white/[0.08]" />
            <span className="px-3 text-[11px] uppercase tracking-wider text-slate-500">
              ou
            </span>
            <div className="flex-1 border-t border-white/[0.08]" />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting || googleSubmitting}
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-60 text-sm font-medium text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {googleSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Continuar com Google</span>
          </button>
        </div>

        {/* Cloud sync note */}
        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Cloud className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" aria-hidden="true" />
          <span>Cada conta guarda seus dados isolados e salvos na nuvem.</span>
        </p>
      </div>
    </div>
  );
}
