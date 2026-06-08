"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { X, CheckCircle, AlertTriangle, Info, Lightbulb, RefreshCw, BarChart3, Activity, AlertCircle } from "lucide-react";

const severityConfig: Record<string, { icon: any; class: string; label: string }> = {
  kritik: { icon: AlertTriangle, class: "bg-red-50 border-red-200 text-red-700", label: "Kritik" },
  uyari: { icon: Info, class: "bg-amber-50 border-amber-200 text-amber-700", label: "Uyari" },
  bilgi: { icon: CheckCircle, class: "bg-blue-50 border-blue-200 text-blue-700", label: "Bilgi" },
};

const typeLabels: Record<string, string> = {
  risk_onleme: "Risk Onleme", psikososyal: "Psikososyal", ergonomi: "Ergonomi",
  egitim: "Egitim", kaza_onleme: "Kaza Onleme", veri_kalitesi: "Veri Kalitesi", genel: "Genel",
};

export default function AIDashboard() {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setEditStatus(null);
    try {
      const [sRes, mRes] = await Promise.all([
        supabase.from("ai_risk_suggestions").select("*").eq("is_resolved", false).order("created_at", { ascending: false }).limit(20),
        supabase.from("data_quality_metrics").select("*").order("measured_at", { ascending: false }).limit(10),
      ]);
      if (sRes.data) setSuggestions(sRes.data);
      if (mRes.data) setMetrics(mRes.data);
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Veri yüklenemedi" });
    } finally { setLoading(false); }
  };

  const runAnalysis = async () => {
    setRunning(true);
    setEditStatus(null);
    try {
      const { error } = await supabase.rpc("generate_risk_suggestions");
      if (error) throw error;
      await logAudit("ai_risk_suggestions", "INSERT", null, null, { action: "generate_risk_suggestions" });
      setEditStatus({ type: "success", message: "Analiz tamamlandı" });
      await loadData();
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Analiz başarısız" });
    } finally {
      setRunning(false);
    }
  };

  const resolveSuggestion = async (id: string) => {
    setEditStatus(null);
    try {
      const { error } = await supabase.from("ai_risk_suggestions").update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await logAudit("ai_risk_suggestions", "UPDATE", id, null, { is_resolved: true });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      setEditStatus({ type: "error", message: e.message || "Öneri kapatılamadı" });
    }
  };

  const avgScore = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + Number(m.quality_score), 0) / metrics.length) : 0;

  return (
    <div className="p-6">
      {editStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm border ${editStatus.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {editStatus.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {editStatus.message}
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Risk onleme onerileri ve veri kalitesi</p>
        </div>
        <button onClick={runAnalysis} disabled={running} className="btn btn-primary mt-4 lg:mt-0">
          <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Analiz ediliyor..." : "Analizi Calistir"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-2xl font-bold">{suggestions.filter((s) => s.severity === "kritik").length}</p><p className="text-xs text-gray-500">Kritik Oneri</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Lightbulb className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-2xl font-bold">{suggestions.length}</p><p className="text-xs text-gray-500">Aktif Oneri</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-2xl font-bold">%{avgScore}</p><p className="text-xs text-gray-500">Veri Kalitesi</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4" />Risk Onleme Onerileri</h2>
          {loading ? <p className="text-center py-8 text-gray-400">Yukleniyor...</p> : suggestions.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500">Henuz oneri bulunmuyor</p>
              <p className="text-xs text-gray-400 mt-1">Analizi calistirarak risk tespiti yapabilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => {
                const cfg = severityConfig[s.severity] || severityConfig.bilgi;
                return (
                  <div key={s.id} className={`card p-4 border-l-4 ${cfg.class.replace(/bg-.*? /, "").replace(/border-.*? /, "")}`}
                    style={{ borderLeftColor: s.severity === "kritik" ? "#ef4444" : s.severity === "uyari" ? "#f59e0b" : "#3b82f6" }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <cfg.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">{typeLabels[s.suggestion_type] || s.suggestion_type}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.class}`}>{cfg.label}</span>
                        </div>
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                      </div>
                      <button aria-label="Cozuldu olarak isaretle" onClick={() => resolveSuggestion(s.id)} className="p-1 hover:bg-gray-100 rounded ml-2 flex-shrink-0"><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" />Veri Kalitesi</h2>
          {loading ? <p className="text-center py-8 text-gray-400">Yukleniyor...</p> : metrics.length === 0 ? (
            <div className="card p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Henuz veri kalitesi olcumu yok</p>
              <p className="text-xs text-gray-400 mt-1">Analizi calistirdiktan sonra burada gorunecektir</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.map((m) => {
                const score = Number(m.quality_score);
                const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={m.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{m.module_name}</span>
                      <span className="text-sm font-bold">{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }}></div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{m.total_records} kayit</span>
                      <span>{m.complete_records} tam</span>
                      {m.missing_critical_fields > 0 && <span className="text-red-500">{m.missing_critical_fields} eksik</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}