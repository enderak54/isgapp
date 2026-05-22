"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, ChevronDown, ChevronUp, Eye,
  CheckCircle, XCircle, RotateCcw, Archive, AlertCircle,
} from "lucide-react";

const actionMeta: Record<string, { icon: any; label: string; color: string }> = {
  INSERT:  { icon: CheckCircle, label: "Ekleme",     color: "text-green-600 bg-green-50" },
  UPDATE:  { icon: RotateCcw,   label: "Güncelleme", color: "text-blue-600 bg-blue-50" },
  DELETE:  { icon: XCircle,     label: "Silme",      color: "text-red-600 bg-red-50" },
  ARCHIVE: { icon: Archive,     label: "Arşiv",      color: "text-yellow-600 bg-yellow-50" },
};

const tableLabels: Record<string, string> = {
  personel: "Personel",
  personel_belgeleri: "Personel Belgeleri",
  personel_myk_egitimleri: "MYK Eğitimleri",
  ihtar_tutanagi: "İhtar Tutanağı",
  ihtar_dosyalari: "İhtar Dosyaları",
  audit_log: "Denetim Kaydı",
  ayarlar: "Ayarlar",
};

function renderJSON(val: any) {
  if (!val) return null;
  try {
    const o = typeof val === "string" ? JSON.parse(val) : val;
    return JSON.stringify(o, null, 2);
  } catch { return String(val); }
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const perPage = 50;

  useEffect(() => { setPage(0); }, [tableFilter, actionFilter]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("audit_log").select("*", { count: "exact" });
    if (tableFilter) query = query.eq("table_name", tableFilter);
    if (actionFilter) query = query.eq("action", actionFilter);
    query = query.order("created_at", { ascending: false }).range(page * perPage, (page + 1) * perPage - 1);
    const { data } = await query;
    if (data) setLogs(data);
    setLoading(false);
  }, [tableFilter, actionFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fetchTables = useCallback(async () => {
    const { data } = await supabase.from("audit_log").select("table_name");
    if (data) setAllTables([...new Set(data.map(d => d.table_name))].sort());
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const filtered = logs.filter(l =>
    !search ||
    l.table_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.record_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Eye className="w-6 h-6 text-gray-400" />
          <h1 className="text-xl font-bold text-gray-800">Denetim Günlüğü</h1>
          <span className="text-xs text-gray-400 font-mono">audit_log</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Tablo, işlem veya kayıt ID ara..." value={search}
              onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} className="input text-xs">
            <option value="">Tüm Tablolar</option>
            {allTables.map(t => <option key={t} value={t}>{tableLabels[t] || t}</option>)}
          </select>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input text-xs">
            <option value="">Tüm İşlemler</option>
            {Object.entries(actionMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Kayıt bulunamadı</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tablo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kayıt ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detay</th>
                </tr>
              </thead>
              <tbody>
                {filtered.flatMap((log) => {
                  const meta = actionMeta[log.action] || { icon: AlertCircle, label: log.action, color: "text-gray-600 bg-gray-50" };
                  const Icon = meta.icon;
                  const open = expanded.has(log.id);
                  const rows: any[] = [
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          <Icon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 font-mono">{log.table_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.record_id ? `${log.record_id.slice(0, 8)}…` : "—"}</td>
                      <td className="px-4 py-3">
                        {(log.old_values || log.new_values) ? (
                          <button onClick={() => toggle(log.id)} className="text-gray-400 hover:text-gray-600">
                            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>,
                  ];
                  if (open) {
                    rows.push(
                      <tr key={`${log.id}-d`}>
                        <td colSpan={5} className="px-4 py-3 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            {log.old_values && (
                              <div>
                                <p className="font-medium text-gray-500 mb-1">Önceki Değerler</p>
                                <pre className="bg-white border border-gray-200 rounded p-2 overflow-x-auto text-gray-700 whitespace-pre-wrap">{renderJSON(log.old_values)}</pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <p className="font-medium text-gray-500 mb-1">Yeni Değerler</p>
                                <pre className="bg-white border border-gray-200 rounded p-2 overflow-x-auto text-gray-700 whitespace-pre-wrap">{renderJSON(log.new_values)}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
          <span>Sayfa {page + 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn btn-sm">← Önceki</button>
            <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < perPage} className="btn btn-sm">Sonraki →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
