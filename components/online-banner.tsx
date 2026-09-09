"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OnlineBanner() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOffline = () => { setOnline(false); setShowReconnected(false); };
    const onOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      // 3 sn sonra banneri gizle; sayfayi yenilemeye gerek yok — supabase fetch retry zaten devrede
      setTimeout(() => setShowReconnected(false), 3000);
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!online) {
    return (
      <div className="sticky top-0 z-50 bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2">
        <WifiOff className="w-3.5 h-3.5" /> İnternet bağlantısı kesildi — yeniden bağlanınca otomatik devam edecek
      </div>
    );
  }
  if (showReconnected) {
    return (
      <div className="sticky top-0 z-50 bg-green-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2">
        <Wifi className="w-3.5 h-3.5" /> Bağlantı geri geldi
      </div>
    );
  }
  return null;
}
