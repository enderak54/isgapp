// isgapp-updater — uygulama içinden güncelleme tetikleyici.
//
// Endpoint'ler:
//   POST /update   X-Updater-Key ile doğrular, update.sh'i arka planda çalıştırır.
//                  Çalışan bir güncelleme varsa 409 döner.
//   POST /cancel   Çalışan güncellemeyi durdurmaya çalışır.
//   GET  /status   { running, exitCode, startedAt, finishedAt, lastLine }
//   GET  /log      Log dosyasının son N satırı (?lines=100)
//   GET  /health   200 (kullanılabilirlik)
//
// Yetkilendirme: tüm uçlar X-Updater-Key başlığının UPDATER_API_KEY ile
// eşleşmesini ister. UPDATER_API_KEY boşsa istekler reddedilir.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { promises as fs, openSync, closeSync } from "node:fs";
import path from "node:path";

const PORT = Number(process.env.UPDATER_PORT || 9100);
const API_KEY = process.env.UPDATER_API_KEY || "";
const LOG_FILE = process.env.LOG_FILE || "/data/update.log";
const LOCK_FILE = process.env.LOCK_FILE || "/data/update.lock";
const UPDATE_SCRIPT = process.env.UPDATE_SCRIPT || "/repo/self-host/update.sh";
const WORKDIR = process.env.WORKDIR || "/repo/self-host";

let child = null;
let startedAt = null;

function isAuthorized(req) {
  if (!API_KEY) return false;
  const key = req.headers["x-updater-key"];
  if (!key) return false;
  // Sabit zaman karşılaştırması yerine basit güvenli karşılaştırma.
  const a = Buffer.from(String(key));
  const b = Buffer.from(API_KEY);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readLock() {
  try {
    return JSON.parse(await fs.readFile(LOCK_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function writeLock(data) {
  await fs.mkdir(path.dirname(LOCK_FILE), { recursive: true });
  await fs.writeFile(LOCK_FILE, JSON.stringify(data));
}

async function clearLock() {
  try {
    await fs.unlink(LOCK_FILE);
  } catch {
    /* yok sayılır */
  }
}

async function tailLines(n) {
  try {
    const content = await fs.readFile(LOG_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.length > 0);
    return lines.slice(-n).join("\n");
  } catch {
    return "";
  }
}

function startUpdate(res) {
  const started = Date.now();
  startedAt = started;

  // Log dosyasını temizle (yeni güncelleme için) ve fd'yi aç.
  let logFd;
  try {
    logFd = openSync(LOG_FILE, "w");
  } catch (err) {
    return json(res, 500, { error: "Log dosyası açılamadı: " + err.message });
  }

  child = spawn("sh", [UPDATE_SCRIPT], {
    cwd: WORKDIR,
    env: process.env,
    stdio: ["ignore", logFd, logFd],
  });

  child.on("error", async (err) => {
    try {
      closeSync(logFd);
    } catch {}
    await writeLock({
      running: false,
      exitCode: 1,
      startedAt: started,
      finishedAt: Date.now(),
      lastLine: "Güncelleme başlatılamadı: " + err.message,
    });
    child = null;
  });

  child.on("close", async (code) => {
    try {
      closeSync(logFd);
    } catch {}
    await writeLock({
      running: false,
      exitCode: code,
      startedAt: started,
      finishedAt: Date.now(),
      lastLine: code === 0 ? "Güncelleme tamamlandı" : "Güncelleme hata ile bitti (çıkış: " + code + ")",
    });
    child = null;
  });

  json(res, 202, { running: true, startedAt: started, message: "Güncelleme başlatıldı" });
}

function stopUpdate(res) {
  if (!child) {
    return json(res, 200, { running: false, message: "Çalışan güncelleme yok" });
  }
  try {
    child.kill("SIGINT");
    setTimeout(() => {
      try {
        child?.kill("SIGKILL");
      } catch {}
    }, 8000);
  } catch (err) {
    return json(res, 500, { error: "Durdurulamadı: " + err.message });
  }
  return json(res, 202, { running: true, message: "Güncelleme durduruluyor" });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (!isAuthorized(req)) {
    return json(res, 401, { error: "Geçersiz API key" });
  }

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/update") {
      const lock = await readLock();
      if (child || (lock && lock.running)) {
        return json(res, 409, { running: true, message: "Zaten bir güncelleme çalışıyor" });
      }
      await clearLock();
      return startUpdate(res);
    }

    if (req.method === "POST" && url.pathname === "/cancel") {
      return stopUpdate(res);
    }

    if (req.method === "GET" && url.pathname === "/status") {
      const lock = await readLock();
      const running = !!child;
      const lastLine = running
        ? "Güncelleme çalışıyor..."
        : lock?.lastLine || "Henüz güncelleme yapılmadı";
      return json(res, 200, {
        running,
        startedAt: startedAt || lock?.startedAt || null,
        finishedAt: lock?.finishedAt || null,
        exitCode: running ? null : lock?.exitCode ?? null,
        lastLine,
      });
    }

    if (req.method === "GET" && url.pathname === "/log") {
      const lines = Math.min(Number(url.searchParams.get("lines")) || 100, 1000);
      const log = await tailLines(lines);
      return json(res, 200, { log });
    }

    return json(res, 404, { error: "Bilinmeyen yol" });
  } catch (err) {
    return json(res, 500, { error: "Sunucu hatası: " + err.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`isgapp-updater dinliyor: :${PORT}`);
});
