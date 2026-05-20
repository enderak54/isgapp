"use client";

import { useState } from "react";
import { Bell, User, AlertTriangle, Ambulance, Quote } from "lucide-react";

export default function Dashboard() {
  const [notes, setNotes] = useState(["", "", ""]);

  return (
    <main className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">İşyeri Sicili</h2>
        <div className="flex items-center gap-4">
          <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-blue-600" />
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* İşyeri Sicili Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              İşyeri Sicili
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">365 Günde</p>
                <p className="text-4xl font-bold text-green-600">3</p>
                <p className="text-sm text-gray-600">kaza</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">1 Ayda</p>
                <p className="text-4xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600">kaza</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">1 Haftada</p>
                <p className="text-4xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600">kaza</p>
              </div>
            </div>

            {/* Kaza İstatistiği */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-red-600 font-medium underline cursor-pointer">
                    Kaza istatistiği
                  </h4>
                  <p className="text-gray-700 mt-2">
                    Son 365 Gün: <span className="font-bold text-xl">3</span>
                  </p>
                </div>
                <Ambulance className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-blue-500">✓</span> Notlar
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {notes.map((note, index) => (
                <textarea
                  key={index}
                  value={note}
                  onChange={(e) => {
                    const newNotes = [...notes];
                    newNotes[index] = e.target.value;
                    setNotes(newNotes);
                  }}
                  placeholder="Not ekle..."
                  className="h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Uyarılar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Uyarılar
              </h3>
              <span className="text-gray-400 cursor-pointer">•••</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Tarihi geçen KKD'ler
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Süresi dolan sağlık muayeneleri
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                MYK operatör belgeleri
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Periyodu dolan iş ekipmanları
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                Süresi dolan evraklar
              </li>
            </ul>
            <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
              <Bell className="w-5 h-5" />
              Toplam 16 uyarı
            </button>
          </div>

          {/* Günün Motive Sözü */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Quote className="w-5 h-5 text-blue-400" />
              Günün Motive Sözü
            </h3>
            <div className="relative p-4 bg-gray-50 rounded-lg">
              <Quote className="w-8 h-8 text-blue-200 absolute top-2 left-2" />
              <p className="text-center text-lg text-gray-800 font-medium pt-6 pb-2">
                Her güvenlik önlemi,
                <br />
                bir kazayı önler!
              </p>
              <Quote className="w-8 h-8 text-blue-200 absolute bottom-2 right-2 rotate-180" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
