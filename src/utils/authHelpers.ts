const SYNTHETIC_DOMAIN = 'orby.local';

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function validateUsername(raw: string): {
  valid: boolean;
  error: string | null;
  normalized: string;
} {
  const normalized = normalizeUsername(raw);

  if (!normalized) {
    return { valid: false, error: 'Informe seu usuário.', normalized };
  }

  if (normalized.length < 3) {
    return {
      valid: false,
      error: 'O usuário deve ter pelo menos 3 caracteres.',
      normalized,
    };
  }

  if (normalized.length > 40) {
    return {
      valid: false,
      error: 'O usuário deve ter no máximo 40 caracteres.',
      normalized,
    };
  }

  // Allow either a clean username (letters, digits, ., _, -) or a standard email
  if (normalized.includes('@')) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
      return {
        valid: false,
        error: 'Digite um usuário válido (ou um e-mail válido).',
        normalized,
      };
    }
    return { valid: true, error: null, normalized };
  }

  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    return {
      valid: false,
      error: 'Use apenas letras, números, ponto (.), traço (-) ou underline (_).',
      normalized,
    };
  }

  return { valid: true, error: null, normalized };
}

export function usernameToAuthEmail(rawUsername: string): string {
  const normalized = normalizeUsername(rawUsername);
  if (normalized.includes('@')) {
    return normalized;
  }
  return `${normalized}@${SYNTHETIC_DOMAIN}`;
}

export function extractDisplayUsername(
  authEmail: string | null | undefined,
  displayName: string | null | undefined
): string {
  if (displayName && displayName.trim().length >= 3) {
    return displayName.trim().slice(0, 40);
  }
  if (authEmail) {
    const lower = authEmail.trim().toLowerCase();
    if (lower.endsWith(`@${SYNTHETIC_DOMAIN}`)) {
      return lower.slice(0, -(`@${SYNTHETIC_DOMAIN}`.length));
    }
    const prefix = lower.split('@')[0];
    if (prefix && prefix.length >= 3) {
      return prefix.slice(0, 40);
    }
    return lower.slice(0, 40);
  }
  return 'usuario';
}

export function validateRegistrationFields(
  username: string,
  password: string,
  confirmPassword: string
): string | null {
  const userCheck = validateUsername(username);
  if (!userCheck.valid) return userCheck.error;

  if (password.length < 6) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  if (password.length > 128) {
    return 'A senha deve ter no máximo 128 caracteres.';
  }

  if (password !== confirmPassword) {
    return 'As senhas não conferem. Verifique o campo "Repetir senha".';
  }

  return null;
}

export interface FriendlyAuthError {
  message: string;
  needsEmailPasswordSetup?: boolean;
  needsAuthorizedDomain?: boolean;
}

export function mapFirebaseAuthError(error: unknown): FriendlyAuthError {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return {
        message: 'Este usuário já está cadastrado. Escolha outro ou faça login.',
      };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        message: 'Usuário ou senha incorretos. Verifique e tente novamente.',
      };
    case 'auth/invalid-email':
      return {
        message: 'Formato de usuário inválido. Use apenas letras, números, ponto ou underline.',
      };
    case 'auth/weak-password':
      return {
        message: 'A senha é muito fraca. Use pelo menos 6 caracteres.',
      };
    case 'auth/too-many-requests':
      return {
        message: 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.',
      };
    case 'auth/network-request-failed':
      return {
        message: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
      };
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return {
        message: 'Login com Google cancelado antes de concluir.',
      };
    case 'auth/popup-blocked':
      return {
        message: 'O navegador bloqueou a janela do Google. Permita pop-ups para continuar.',
      };
    case 'auth/unauthorized-domain':
      return {
        message:
          'Este domínio ainda não está autorizado no Firebase Authentication. Adicione o domínio da Vercel em Authentication > Settings > Authorized domains.',
        needsAuthorizedDomain: true,
      };
    case 'auth/operation-not-allowed':
      return {
        message:
          'O login por Usuário e Senha precisa ser ativado no Console do Firebase (Authentication > Sign-in method > E-mail/senha). Enquanto isso, você já pode entrar com Google abaixo.',
        needsEmailPasswordSetup: true,
      };
    default:
      return {
        message: 'Não foi possível concluir a autenticação. Tente novamente.',
      };
  }
}
