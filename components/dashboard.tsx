"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Ambulance, Users, Shield, TrendingUp, Activity, Clock, Calendar } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPersonel: 0,
    kaza365: 0,
    kaza30: 0,
    kaza7: 0,
    uyarilar: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date();
    const date365 = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const date30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const date7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [{ count: totalPersonel }, { count: kaza365 }, { count: kaza30 }, { count: kaza7 }] = await Promise.all([
      supabase.from("personel").select("*", { count: "exact", head: true }),
      supabase.from("is_kazalari").select("*", { count: "exact", head: true }).gte("tarih", date365),
      supabase.from("is_kazalari").select("*", { count: "exact", head: true }).gte("tarih", date30),
      supabase.from("is_kazalari").select("*", { count: "exact", head: true }).gte("tarih", date7),
    ]);

    const { data: expiredDocs } = await supabase
      .from("myk_belgeri")
      .select("*")
      .lt("gecerlilik_tarihi", today.toISOString().split("T")[0]);

    const uyarilar = (expiredDocs?.length || 0) + 5;

    setStats({
      totalPersonel: totalPersonel || 0,
      kaza365: kaza365 || 0,
      kaza30: kaza30 || 0,
      kaza7: kaza7 || 0,
      uyarilar,
    });
    setLoading(false);
  };

  if (loading) return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
        <span>Yükleniyor...</span>
      </div>
    </div>
  );

  return (
    <main className="flex-1 p-8 bg-[#f8f7f4] min-h-screen">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">İşyeri Sicili</h2>
        <p className="text-gray-500 mt-1">Güvenlik istatistikleri ve genel bakış</p>
      </header>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">+0</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalPersonel}</p>
          <p className="text-sm text-gray-500 mt-1">Toplam Personel</p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.uyarilar}</p>
          <p className="text-sm text-gray-500 mt-1">Aktif Uyarılar</p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs text-green-600">Güvenli</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.kaza30}</p>
          <p className="text-sm text-gray-500 mt-1">Bu Ay Kaza</p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.kaza365}</p>
          <p className="text-sm text-gray-500 mt-1">365 Günde Kaza</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Ana İstatistik */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Kaza İstatistikleri</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Son 365 gün
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">365 Gün</p>
              <p className="text-4xl font-bold text-gray-700">{stats.kaza365}</p>
              <p className="text-xs text-gray-400 mt-1">kaza</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">30 Gün</p>
              <p className="text-4xl font-bold text-gray-700">{stats.kaza30}</p>
              <p className="text-xs text-gray-400 mt-1">kaza</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">7 Gün</p>
              <p className="text-4xl font-bold text-gray-700">{stats.kaza7}</p>
              <p className="text-xs text-gray-400 mt-1">kaza</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Son 365 günlük toplam</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.kaza365} <span className="text-sm font-normal text-gray-500">kaza</span></p>
            </div>
            <Ambulance className="w-12 h-12 text-gray-200" />
          </div>
        </div>

        {/* Uyarılar */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Uyarılar</h3>
          <div className="space-y-3">
            {[
              { label: "Tarihi geçen KKD'ler", count: 3 },
              { label: "Süresi dolan sağlık raporları", count: 2 },
              { label: "MYK belgeleri", count: 1 },
              { label: "Periyodik kontrol", count: 4 },
              { label: "Süresi dolan evraklar", count: 5 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-medium">{item.count}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 btn btn-primary">
            <AlertTriangle className="w-4 h-4" />
            {stats.uyarilar} Aktif Uyarı
          </button>
        </div>
      </div>

      {/* Motivasyon */}
      <div className="mt-6 card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl">💡</div>
          <div>
            <p className="text-lg font-medium text-gray-800">Günün Sözü</p>
            <p className="text-gray-500 mt-1">"Her güvenlik önlemi, bir kazayı önler!"</p>
          </div>
        </div>
      </div>
    </main>
  );
}