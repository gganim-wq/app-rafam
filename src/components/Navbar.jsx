import React, { useState } from 'react';
import { Cpu, RefreshCw, Database, Settings, X, Save } from 'lucide-react';
import { getBackendUrl, setBackendUrl } from '../utils/config';

export default function Navbar({ onSync }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(getBackendUrl());

  const handleSaveSettings = () => {
    setBackendUrl(tempUrl);
    setShowSettings(false);
    window.location.reload();
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Sincronizando...');
    try {
      const response = await fetch(`${getBackendUrl()}/api/sincronizar`, {
        method: 'POST',
      });
      const data = await response.json();
      setSyncStatus('Sincronización iniciada');
      setTimeout(() => {
        setSyncStatus('');
      }, 4000);
      if (onSync) onSync();
    } catch (error) {
      console.error('Error al sincronizar:', error);
      setSyncStatus('Error de conexión');
      setTimeout(() => {
        setSyncStatus('');
      }, 4000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <nav className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-neonBlue to-neonPurple rounded-lg blur opacity-75 animate-pulse"></div>
          <div className="relative bg-rafamDark-900 p-2 rounded-lg border border-white/10 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-neonBlue" />
          </div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-neonBlue">
            RAG Chascomús
          </span>
          <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest bg-neonPurple/20 text-neonPurple border border-neonPurple/30 rounded-md">
            v2.5.Flash
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {syncStatus && (
          <span className="text-xs font-mono text-neonBlue/80 animate-pulse bg-neonBlue/5 px-3 py-1.5 rounded border border-neonBlue/20">
            {syncStatus}
          </span>
        )}

        <button
          onClick={handleSync}
          disabled={syncing}
          className="relative group overflow-hidden px-4 py-2 rounded-lg border border-neonBlue/30 bg-neonBlue/5 text-neonBlue text-sm font-semibold tracking-wide flex items-center gap-2 hover:bg-neonBlue/20 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
          Sincronizar Estructura
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span>API ONLINE</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border transition-all duration-300 ${
              showSettings 
                ? 'bg-neonBlue/10 border-neonBlue/30 text-neonBlue' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Configuración de Servidor RAG"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-72 p-4 bg-rafamDark-900 border border-white/10 rounded-xl shadow-premium z-50 glass flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-bold text-slate-200">Configuración de Servidor</span>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Dirección del Backend:</label>
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="bg-rafamDark-950 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neonBlue/50 transition-all text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTempUrl('http://localhost:8000')}
                  className="flex-1 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  Localhost
                </button>
                <button
                  onClick={() => {
                    const localIP = window.prompt("Ingrese la IP local (ej. 192.168.1.50):");
                    if (localIP) setTempUrl(`http://${localIP.trim()}:8000`);
                  }}
                  className="flex-1 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  IP Local
                </button>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2 bg-gradient-to-r from-neonBlue to-neonPurple rounded-lg text-white font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar y Conectar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
