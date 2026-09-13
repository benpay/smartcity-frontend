import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../lib/api';

interface Sensor {
  id: string;
  name: string;
  sensorCode: string;
  type: 'HTTP_POLL' | 'MANUAL_UPLOAD';
  status: 'active' | 'paused';
  url?: string;
}

interface TemperatureReading {
  id: string;
  timestamp: string;
  valueC: number;
}

interface IngestionRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'error';
  recordsProcessed: number;
  errorMessage?: string;
}

export default function SensorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(20);

  // Obtener sensor
  const { data: sensor } = useQuery<Sensor>({
    queryKey: ['sensor', id],
    queryFn: async () => {
      const { data } = await api.get(`/getSensorById/${id}`);
      return data;
    },
  });

  // Obtener lecturas
  const { data: readings = [] } = useQuery<TemperatureReading[]>({
    queryKey: ['readings', id, limit],
    queryFn: async () => {
      const { data } = await api.get(`/readings/${id}/readings?limit=${limit}`);
      return data;
    },
  });

  // Obtener historial de ingestas
  const { data: ingestions = [] } = useQuery<IngestionRun[]>({
    queryKey: ['ingestions', id],
    queryFn: async () => {
      const { data } = await api.get(`/ingestion/${id}/ingestions`);
      return data;
    },
  });

  // Ingestar ahora
  const ingestMutation = useMutation({
    mutationFn: () => api.post(`/ingestion/${id}/ingest`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings', id] });
      queryClient.invalidateQueries({ queryKey: ['ingestions', id] });
    },
  });

  // Datos para la gráfica — ordenados de más antiguo a más reciente
  const chartData = [...readings]
    .reverse()
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temp: r.valueC,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/sensors')}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Sensores
        </button>
        <h1 className="text-lg font-bold text-gray-900">
          {sensor?.name ?? 'Cargando...'}
        </h1>
        <span className="text-xs text-gray-500">{sensor?.sensorCode}</span>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Info del sensor */}
        {sensor && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  Tipo: <span className="text-gray-800 font-medium">{sensor.type}</span>
                </p>
                {sensor.url && (
                  <p className="text-xs text-gray-400 truncate max-w-xs">{sensor.url}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  sensor.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {sensor.status === 'active' ? 'Activo' : 'Pausado'}
                </span>
                <button
                  onClick={() => ingestMutation.mutate()}
                  disabled={ingestMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  {ingestMutation.isPending ? 'Ingiriendo...' : 'Ingestar ahora'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gráfica de temperatura */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Temperatura (últimas {limit} lecturas)
            </h2>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Sin lecturas. Pulsa "Ingestar ahora".
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={['auto', 'auto']}
                  unit="°C"
                />
                <Tooltip formatter={(value) => [`${value}°C`, 'Temperatura']} />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Historial de ingestas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Historial de ingestas</h2>
          {ingestions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin ingestas.</p>
          ) : (
            <div className="space-y-2">
              {ingestions.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                      run.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {run.status === 'success' ? 'OK' : 'Error'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(run.startedAt).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-700 text-xs">
                      {run.recordsProcessed} registros
                    </span>
                    {run.errorMessage && (
                      <p className="text-red-500 text-xs mt-0.5">{run.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}