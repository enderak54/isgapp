-- Giriş sistemi (kullanıcı adı + şifre)
-- app_users: uygulama kullanıcıları (şifre hash'i scrypt, asla plaintext saklanmaz)
-- app_sessions: oturum token'ları (httpOnly cookie ile eşleşir)
--
-- GÜVENLİK: Bu tablolara anon/authenticated/service_role erişimi YOKTUR.
-- RLS açıktır ve hiçbir policy eklenmez (deny-all). Auth API route'ları
-- doğrudan pg (DATABASE_URL) üzerinden erişir; supabase client bu tablolara
-- asla bağlanmaz.

CREATE TABLE IF NOT EXISTS public.app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    salt text NOT NULL,
    ad_soyad text,
    rol text NOT NULL DEFAULT 'kullanici',
    aktif boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.app_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_token ON public.app_sessions(token);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user ON public.app_sessions(user_id);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

-- Bilinçli olarak hiçbir RLS policy eklenmez (deny-all).
