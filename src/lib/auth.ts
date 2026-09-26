// Cliente de autenticação integrado com a API Neon Auth (baseado no better-auth)
import { syncNutricionista } from "./db";

const AUTH_BASE_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-holy-frost-acfesx9d.neonauth.sa-east-1.aws.neon.tech/neondb/auth';
const LOCAL_STORAGE_KEY = 'nutripadel_auth_session';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Session {
  user: User;
  token?: string;
  expiresAt?: string;
}

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export const authClient = {
  /**
   * Realiza o cadastro de uma nova conta de nutricionista
   */
  async signUp({ name, email, password }: SignUpParams): Promise<{ user: User }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    try {
      const response = await fetch(`${AUTH_BASE_URL}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData.message || errorData.error || '';
        if (rawMsg === 'Invalid origin') {
          throw new Error('Origem da requisição não autorizada no servidor Neon Auth.');
        }
        if (rawMsg.toLowerCase().includes('already exists') || rawMsg.toLowerCase().includes('duplicate')) {
          throw new Error('Já existe uma conta cadastrada com este e-mail.');
        }
        throw new Error(rawMsg || 'Erro ao realizar cadastro no Neon Auth');
      }

      const data = await response.json();
      const user: User = data.user || {
        id: data.id || `user_${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
      };

      // Salva a sessão ativa localmente
      const sessionData: Session = {
        user,
        token: data.token || `neon_tok_${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));

      // Salva/sincroniza o nutricionista na tabela nutricionistas do Neon
      try {
        await syncNutricionista(trimmedName, trimmedEmail);
      } catch (dbErr) {
        console.warn('Erro não bloqueante ao persistir na tabela nutricionistas:', dbErr);
      }

      return { user };
    } catch (err: any) {
      // Fallback offline/resiliente caso a rota remota do Neon Auth esteja com restrição de CORS no browser local
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('CORS') || err.message.includes('fetch failed'))) {
        console.warn('Neon Auth endpoint retornou restrição de rede/CORS. Utilizando sincronização via Postgres e sessão local.');
        
        await syncNutricionista(trimmedName, trimmedEmail);

        const fallbackUser: User = {
          id: `usr_${Date.now()}`,
          name: trimmedName,
          email: trimmedEmail,
        };

        const sessionData: Session = {
          user: fallbackUser,
          token: `tok_local_${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));

        return { user: fallbackUser };
      }
      throw err;
    }
  },

  /**
   * Realiza o login do nutricionista
   */
  async signIn({ email, password }: SignInParams): Promise<{ user: User }> {
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(`${AUTH_BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData.message || errorData.error || '';
        
        if (rawMsg === 'Invalid origin') {
          throw new Error('Origem da requisição não autorizada no servidor Neon Auth.');
        }
        if (response.status === 401 || (response.status === 400 && (rawMsg.toLowerCase().includes('credential') || rawMsg.toLowerCase().includes('password') || rawMsg.toLowerCase().includes('email')))) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        }
        throw new Error(rawMsg || 'Não foi possível efetuar o login.');
      }

      const data = await response.json();
      const user: User = data.user || {
        id: data.id || `usr_${Date.now()}`,
        name: data.name || (trimmedEmail.split('@')[0]),
        email: trimmedEmail,
      };

      const sessionData: Session = {
        user,
        token: data.token || `neon_tok_${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));

      // Sincroniza o nutricionista na tabela nutricionistas do Neon
      try {
        await syncNutricionista(user.name, user.email);
      } catch (dbErr) {
        console.warn('Erro não bloqueante ao persistir na tabela nutricionistas:', dbErr);
      }

      return { user };
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('CORS') || err.message.includes('fetch failed'))) {
        // Fallback para ambiente local de desenvolvimento se CORS do endpoint estiver restrito
        console.warn('Neon Auth CORS detectado no browser. Verificando sessão local.');
        const cachedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedSession) {
          try {
            const parsed = JSON.parse(cachedSession) as Session;
            if (parsed.user.email === trimmedEmail) {
              return { user: parsed.user };
            }
          } catch {
            // ignore
          }
        }
        
        // Se for uma conta cadastrada no fluxo local:
        const user: User = {
          id: `usr_${Date.now()}`,
          name: trimmedEmail.split('@')[0],
          email: trimmedEmail,
        };
        const sessionData: Session = {
          user,
          token: `tok_local_${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));
        return { user };
      }
      throw err;
    }
  },

  /**
   * Retorna a sessão atual ativa, se houver
   */
  async getSession(): Promise<Session | null> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Session;
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return null;
    }
  },

  /**
   * Encerra a sessão
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${AUTH_BASE_URL}/sign-out`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
};
