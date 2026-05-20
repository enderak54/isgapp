"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Ambulance, Users, Shield, TrendingUp, Activity, Calendar, Target, Lightbulb } from "lucide-react";

const motivasyonSozleri = [
  "Güvenlik bir alışkanlıktır, tesadüf değil. — Her gün bir adım daha güvenliye.",
  "En iyi güvenlik ekipmanı, dikkatli bir zihindir.",
  "Bugün güvenli çalış, yarın da güvende ol.",
  "Küçük bir önlem, büyük bir kazayı engeller.",
  "İş sağlığı, aile mutluluğunun temelidir.",
  "Güvenlik kuralları kanla yazılmıştır — onlara saygı duy.",
  "Herkes eve sağ dönmeyi hak eder.",
  "Dikkat bir an, güvenlik bir ömür.",
  "Kaza olmaz demeyen, kaza yaşar.",
  "Güvenli iş, verimli iş demektir.",
  "Bir kask hayat kurtarır, bir ihmal her şeyi bitirir.",
  "İş güvenliği, sevdiklerine olan saygındır.",
  "Bugün yaptığın güvenlik yatırımı, yarının güvencesidir.",
  "Tehlikeyi gör, önlemi al, güvende kal.",
  "Güvenlik kültürü, liderlikten başlar.",
  "Her gün yeni bir fırsat, her an bir sorumluluk.",
  "Kaza anında değil, öncesinde önlenir.",
  "Güvenli çalışma, en büyük başarıdır.",
  "Takım olarak güvende, birlikte güçlüyüz.",
  "İş yerinde güvenlik, evde huzur demektir.",
  "Bir saniyelik dikkatsizlik, ömür boyu pişmanlık.",
  "Güvenlik sadece kural değil, yaşam biçimidir.",
  "Risk almayın, önlem alın.",
  "Güvenli eller, güçlü yarınlar inşa eder.",
  "Her personel bir değer, her güvenlik bir yatırım.",
  "Kaza istatistik değil, gerçek hayatlardır.",
  "Güvenlik bilinci, en güçlü koruma kalkanıdır.",
  "Dün bitti, bugün başlıyor — güvenli başla.",
  "İş güvenliği, insan onuruna saygıdır.",
  "Güvenli çalışma, en güzel geleneğimiz olsun.",
  "Bir kaza bile fazla, sıfır kaza hedefimiz.",
];

const gununSozu = () => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return motivasyonSozleri[dayOfYear % motivasyonSozleri.length];
};

interface ISGStats {
  totalPersonel: number;
  kaza365: number;
  kaza30: number;
  kaza7: number;
  uyarilar: number;
  kso: number; // Kaza Sıklık Oranı
  toplamCalismaGunu: number;
  agirYaralanma: number;
  olum: number;
  riskSkoru: number;
  egitimOrani: number;
  saglikRaporuOrani: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ISGStats>({
    totalPersonel: 0, kaza365: 0, kaza30: 0, kaza7: 0, uyarilar: 0,
    kso: 0, toplamCalismaGunu: 0, agirYaralanma: 0, olum: 0,
    riskSkoru: 0, egitimOrani: 0, saglikRaporuOrani: 0
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

    const [
      { count: totalPersonel },
      { count: kaza365 },
      { count: kaza30 },
      { count: kaza7 },
      { data: kazalar365 },
      { data: mykBelgeler },
      { data: egitimler },
      { data: personel }
    ] = await Promise.all([
      supabase.from("personel").select("*", { count: "exact", head: true }),
      supabase.from("is_kazalari").select("*", { count: "exact", head: true }).gte("tarih", date365),
      supabase.from("is_kazalari").select("*", { count: "exact", head: true }).gte("tarih", date30),
      supabase.from("is_kazalari").select("*", { count: "exact", head: true }).gte("tarih", date7),
      supabase.from("is_kazalari").select("yaralanma_durumu").gte("tarih", date365),
      supabase.from("myk_belgeri").select("*"),
      supabase.from("egitimler").select("*"),
      supabase.from("personel").select("yuksekte_calisamaz, gece_calisamaz, vardiyali_calisamaz")
    ]);

    const agirYaralanma = kazalar365?.filter(k => k.yaralanma_durumu === "agri").length || 0;
    const olum = kazalar365?.filter(k => k.yaralanma_durumu === "olum").length || 0;
    
    // KSO (Kaza Sıklık Oranı) = (Kaza Sayısı / Toplam Çalışılan Gün) x 1.000.000
    const toplamCalismaGunu = (totalPersonel || 0) * 300; // Ortalama yıllık çalışma günü
    const kso = toplamCalismaGunu > 0 ? Math.round(((kaza365 || 0) / toplamCalismaGunu) * 1000000) : 0;

    // Risk Skoru (basit hesaplama)
    const riskSkoru = Math.min(100, Math.round(
      (kaza365 || 0) * 10 + 
      agirYaralanma * 20 + 
      olum * 30 + 
      (mykBelgeler?.filter(b => new Date(b.gecerlilik_tarihi) < today).length || 0) * 5
    ));

    // Eğitim oranı
    const egitimliPersonel = egitimler?.length || 0;
    const egitimOrani = totalPersonel ? Math.round((egitimliPersonel / (totalPersonel || 1)) * 100) : 0;

    // Sağlık raporu durumu
    const saglikSorunlu = personel?.filter(p => p.yuksekte_calisamaz || p.gece_calisamaz || p.vardiyali_calisamaz).length || 0;
    const saglikRaporuOrani = totalPersonel ? Math.round(((totalPersonel - saglikSorunlu) / (totalPersonel || 1)) * 100) : 100;

    const { data: expiredDocs } = await supabase
      .from("myk_belgeri")
      .select("*")
      .lt("gecerlilik_tarihi", today.toISOString().split("T")[0]);

    setStats({
      totalPersonel: totalPersonel || 0,
      kaza365: kaza365 || 0,
      kaza30: kaza30 || 0,
      kaza7: kaza7 || 0,
      uyarilar: (expiredDocs?.length || 0) + 5,
      kso,
      toplamCalismaGunu,
      agirYaralanma,
      olum,
      riskSkoru,
      egitimOrani,
      saglikRaporuOrani
    });
    setLoading(false);
  };

  const getRiskColor = (skor: number) => {
    if (skor < 30) return "text-green-600";
    if (skor < 60) return "text-amber-600";
    return "text-red-600";
  };

  const getKSODurum = (kso: number) => {
    if (kso < 5) return { renk: "green", text: "Çok İyi" };
    if (kso < 15) return { renk: "green", text: "İyi" };
    if (kso < 30) return { renk: "amber", text: "Orta" };
    return { renk: "red", text: "Kritik" };
  };

  if (loading) return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
        <span>İstatistikler yükleniyor...</span>
      </div>
    </div>
  );

  const ksoDurum = getKSODurum(stats.kso);

  return (
    <main className="flex-1 p-4 app-bg min-h-screen">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">İşyeri Sicili</h2>
        <p className="text-sm text-gray-500">Güvenlik istatistikleri ve risk değerlendirmesi</p>
      </header>

      {/* Günün Motivasyon Sözü */}
      <div className="card p-3 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-amber-800 italic">{gununSozu()}</p>
        </div>
      </div>

      {/* Üst İstatistikler */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalPersonel}</p>
          <p className="text-xs text-gray-500 mt-0.5">Toplam Personel</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.uyarilar}</p>
          <p className="text-xs text-gray-500 mt-0.5">Aktif Uyarılar</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${getRiskColor(stats.riskSkoru)}`}>{stats.riskSkoru}</p>
          <p className="text-xs text-gray-500 mt-0.5">Risk Skoru</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ksoDurum.renk === "green" ? "bg-green-50" : ksoDurum.renk === "amber" ? "bg-amber-50" : "bg-red-50"}`}>
              <TrendingUp className={`w-4 h-4 ${ksoDurum.renk === "green" ? "text-green-500" : ksoDurum.renk === "amber" ? "text-amber-500" : "text-red-500"}`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.kso}</p>
          <p className="text-xs text-gray-500 mt-0.5">KSO (Kaza Sıklık)</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Ana İstatistik */}
        <div className="col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Kaza İstatistikleri</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              Son 365 gün
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">365 Gün</p>
              <p className="text-2xl font-bold text-gray-700">{stats.kaza365}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">30 Gün</p>
              <p className="text-2xl font-bold text-gray-700">{stats.kaza30}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Ağır</p>
              <p className="text-2xl font-bold text-amber-600">{stats.agirYaralanma}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Ölümlü</p>
              <p className="text-2xl font-bold text-red-600">{stats.olum}</p>
            </div>
          </div>
           
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-[10px] text-gray-500">KSO</p>
              <p className={`text-sm font-semibold ${ksoDurum.renk === "green" ? "text-green-600" : ksoDurum.renk === "amber" ? "text-amber-600" : "text-red-600"}`}>
                {ksoDurum.text}
              </p>
            </div>
            <div className="text-center border-l border-gray-100">
              <p className="text-[10px] text-gray-500">Eğitim Oranı</p>
              <p className="text-sm font-semibold text-gray-800">{stats.egitimOrani}%</p>
            </div>
            <div className="text-center border-l border-gray-100">
              <p className="text-[10px] text-gray-500">Sağlık Uygunluk</p>
              <p className="text-sm font-semibold text-gray-800">{stats.saglikRaporuOrani}%</p>
            </div>
          </div>
        </div>

        {/* Uyarılar */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Uyarılar</h3>
          <div className="space-y-2">
            {[
              { label: "Tarihi geçen KKD'ler", count: 3 },
              { label: "Süresi dolan sağlık raporları", count: 2 },
              { label: "MYK belgeleri", count: 1 },
              { label: "Periyodik kontrol", count: 4 },
              { label: "Süresi dolan evraklar", count: 5 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-medium">{item.count}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 btn btn-primary text-xs py-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {stats.uyarilar} Aktif Uyarı
          </button>
        </div>
      </div>

      {/* Risk Değerlendirme Matrisi */}
      <div className="mt-3 card p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Risk Değerlendirme Özeti</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Düşük Risk</p>
            <p className="text-lg font-bold text-green-600">{stats.riskSkoru < 30 ? "Güvenli" : "-"}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-700 font-medium">Orta Risk</p>
            <p className="text-lg font-bold text-yellow-600">{stats.riskSkoru >= 30 && stats.riskSkoru < 60 ? "İzle" : "-"}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-xs text-orange-700 font-medium">Yüksek Risk</p>
            <p className="text-lg font-bold text-orange-600">{stats.riskSkoru >= 60 && stats.riskSkoru < 80 ? "Önlem" : "-"}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-xs text-red-700 font-medium">Kritik Risk</p>
            <p className="text-lg font-bold text-red-600">{stats.riskSkoru >= 80 ? "Acil" : "-"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}