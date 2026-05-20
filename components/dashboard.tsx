"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Ambulance, Calendar, TrendingUp, Users, HardHat, Shield } from "lucide-react";

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

  if (loading) return <div className="flex-1 p-6 text-center text-stone-500">Yükleniyor...</div>;

  return (
    <main className="flex-1 p-6 bg-stone-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-700">İşyeri Sicili</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-700 mb-4">İşyeri Sicili</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-stone-100 rounded-lg p-4 text-center">
                <p className="text-sm text-stone-500 mb-2">365 Günde</p>
                <p className="text-4xl font-bold text-stone-600">{stats.kaza365}</p>
                <p className="text-sm text-stone-500">kaza</p>
              </div>
              <div className="bg-stone-100 rounded-lg p-4 text-center">
                <p className="text-sm text-stone-500 mb-2">1 Ayda</p>
                <p className="text-4xl font-bold text-stone-600">{stats.kaza30}</p>
                <p className="text-sm text-stone-500">kaza</p>
              </div>
              <div className="bg-stone-100 rounded-lg p-4 text-center">
                <p className="text-sm text-stone-500 mb-2">1 Haftada</p>
                <p className="text-4xl font-bold text-stone-600">{stats.kaza7}</p>
                <p className="text-sm text-stone-500">kaza</p>
              </div>
            </div>
            <div className="border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-amber-600 font-medium underline cursor-pointer">Kaza istatistiği</h4>
                  <p className="text-stone-600 mt-2">
                    Son 365 Gün: <span className="font-bold text-xl">{stats.kaza365}</span>
                  </p>
                </div>
                <Ambulance className="w-12 h-12 text-stone-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 flex items-center gap-4">
              <div className="bg-stone-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-stone-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Toplam Personel</p>
                <p className="text-2xl font-bold text-stone-700">{stats.totalPersonel}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 flex items-center gap-4">
              <div className="bg-stone-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Aktif Uyarılar</p>
                <p className="text-2xl font-bold text-stone-700">{stats.uyarilar}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Uyarılar
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-stone-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Tarihi geçen KKD'ler
              </li>
              <li className="flex items-start gap-2 text-sm text-stone-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Süresi dolan sağlık muayeneleri
              </li>
              <li className="flex items-start gap-2 text-sm text-stone-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                MYK operatör belgeleri
              </li>
              <li className="flex items-start gap-2 text-sm text-stone-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Periyodu dolan iş ekipmanları
              </li>
              <li className="flex items-start gap-2 text-sm text-stone-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Süresi dolan evraklar
              </li>
            </ul>
            <button className="w-full mt-4 bg-stone-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-stone-700">
              <AlertTriangle className="w-5 h-5" />
              Toplam {stats.uyarilar} uyarı
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-700 mb-4">Günün Motive Sözü</h3>
            <div className="p-4 bg-stone-50 rounded-lg text-center">
              <p className="text-lg text-stone-700 font-medium">
                Her güvenlik önlemi,
                <br />
                bir kazayı önler!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}