"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { displayDate } from "@/lib/tarih";
import CollapsibleCard from "@/components/settings/CollapsibleCard";

interface Kullanici {
  id: string;
  username: string;
  ad_soyad: string | null;
  rol: string;
  aktif: boolean;
  created_at: string;
  last_login_at: string | null;
}

export default function KullaniciYonetimi() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ username: "", sifre: "", ad_soyad: "", rol: "kullanici" });

  const fetchKullanicilar = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/kullanicilar");
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Kullanıcılar yüklenemedi" });
        return;
      }
      setKullanicilar(data.users || []);
    } catch {
      setStatus({ type: "error", message: "Kullanıcılar yüklenemedi" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/kullanicilar");
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) {
            setStatus({ type: "error", message: data.error || "Kullanıcılar yüklenemedi" });
          } else {
            setKullanicilar(data.users || []);
          }
        }
      } catch {
        if (!cancelled) setStatus({ type: "error", message: "Kullanıcılar yüklenemedi" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!user || user.rol !== "admin") return null;

  const handleEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!form.username.trim() || !form.sifre) {
      setStatus({ type: "error", message: "Kullanıcı adı ve şifre gereklidir" });
      return;
    }
    if (form.sifre.length < 8) {
      setStatus({ type: "error", message: "Şifre en az 8 karakter olmalıdır" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithCsrf("/api/kullanicilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.sifre,
          ad_soyad: form.ad_soyad.trim(),
          rol: form.rol,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Kullanıcı oluşturulamadı" });
        return;
      }
      setStatus({ type: "success", message: `Kullanıcı oluşturuldu: ${data.user.username}` });
      setForm({ username: "", sifre: "", ad_soyad: "", rol: "kullanici" });
      fetchKullanicilar();
    } catch {
      setStatus({ type: "error", message: "Kullanıcı oluşturulamadı" });
    } finally {
      setSaving(false);
    }
  };

  const patchKullanici = async (id: string, payload: Record<string, unknown>) => {
    setStatus(null);
    try {
      const res = await fetchWithCsrf(`/api/kullanicilar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Güncelleme başarısız" });
        return;
      }
      setStatus({ type: "success", message: "Kullanıcı güncellendi" });
      fetchKullanicilar();
    } catch {
      setStatus({ type: "error", message: "Güncelleme başarısız" });
    }
  };

  const toggleAktif = (k: Kullanici) => patchKullanici(k.id, { aktif: !k.aktif });

  const rolDegistir = (k: Kullanici, rol: string) => patchKullanici(k.id, { rol });

  const sifreSifirla = async (k: Kullanici) => {
    const sifre = window.prompt(`${k.username} için yeni şifre (en az 8 karakter):`);
    if (sifre === null) return;
    if (sifre.length < 8) {
      setStatus({ type: "error", message: "Şifre en az 8 karakter olmalıdır" });
      return;
    }
    await patchKullanici(k.id, { sifre });
  };

  const silKullanici = async (k: Kullanici) => {
    if (!window.confirm(`${k.username} kullanıcısı silinsin mi?`)) return;
    setStatus(null);
    try {
      const res = await fetchWithCsrf(`/api/kullanicilar/${k.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Silme başarısız" });
        return;
      }
      setStatus({ type: "success", message: `Kullanıcı silindi: ${k.username}` });
      fetchKullanicilar();
    } catch {
      setStatus({ type: "error", message: "Silme başarısız" });
    }
  };

  return (
    <CollapsibleCard
      title="Kullanıcı Yönetimi"
      description="Sisteme giriş yapabilecek kullanıcıları ekleyin ve yönetin"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="space-y-5">
        <form onSubmit={handleEkle} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-800">Yeni Kullanıcı</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Kullanıcı Adı *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input"
                placeholder="ör. ahmet"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Şifre *</label>
              <input
                type="password"
                value={form.sifre}
                onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                className="input"
                placeholder="En az 8 karakter"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Ad Soyad</label>
              <input
                type="text"
                value={form.ad_soyad}
                onChange={(e) => setForm({ ...form, ad_soyad: e.target.value })}
                className="input"
                placeholder="ör. Ahmet Yılmaz"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Rol</label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="input">
                <option value="kullanici">Kullanıcı</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary text-sm">
              {saving ? "Ekleniyor..." : "Kullanıcı Ekle"}
            </button>
          </div>
        </form>

        {status && (
          <div className={`p-3 rounded-lg text-sm ${
            status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {status.message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Yükleniyor...</p>
        ) : kullanicilar.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Henüz kullanıcı yok</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2 pr-3 font-medium">Kullanıcı Adı</th>
                  <th className="py-2 pr-3 font-medium">Ad Soyad</th>
                  <th className="py-2 pr-3 font-medium">Rol</th>
                  <th className="py-2 pr-3 font-medium">Durum</th>
                  <th className="py-2 pr-3 font-medium">Son Giriş</th>
                  <th className="py-2 pr-3 font-medium">Kayıt Tarihi</th>
                  <th className="py-2 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {kullanicilar.map((k) => (
                  <tr key={k.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-800">{k.username}</td>
                    <td className="py-2 pr-3 text-gray-600">{k.ad_soyad || "-"}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={k.rol}
                        onChange={(e) => rolDegistir(k, e.target.value)}
                        disabled={k.id === user.id}
                        className="input text-xs py-1 px-2 w-28"
                        title={k.id === user.id ? "Kendi rolünüzü değiştiremezsiniz" : ""}
                      >
                        <option value="kullanici">Kullanıcı</option>
                        <option value="admin">Yönetici</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => toggleAktif(k)}
                        disabled={k.id === user.id}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          k.aktif ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                        } ${k.id === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={k.id === user.id ? "Kendi hesabınızı pasifleştiremezsiniz" : k.aktif ? "Pasifleştir" : "Aktifleştir"}
                      >
                        {k.aktif ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-gray-600">{displayDate(k.last_login_at)}</td>
                    <td className="py-2 pr-3 text-gray-600">{displayDate(k.created_at)}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => sifreSifirla(k)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          Şifre Sıfırla
                        </button>
                        {k.id !== user.id && (
                          <button onClick={() => silKullanici(k)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
