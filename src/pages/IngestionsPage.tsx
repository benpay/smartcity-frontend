import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface IngestionRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'error';
  recordsProcessed: number;
  errorMessage?: string;
  sensor: {
    id: string;
    name: string;
    sensorCode: string;
  };
}

export default function IngestionsPage() {
  const navigate = useNavigate();

  const { data: ingestions = [], isLoading } = useQuery<IngestionRun[]>({
    queryKey: ['ingestions'],
    queryFn: async () => {
      const { data } = await api.get('/ingestions');
      return data;
    },
  });

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
        <h1 className="text-lg font-bold text-gray-900">Historial de ingestas</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Cargando...</p>
        ) : ingestions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Sin ingestas registradas.</p>
        ) : (
          <div className="space-y-2">
            {ingestions.map((run) => (
              <div
                key={run.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Sensor */}
                  <div>
                    <button
                      onClick={() => navigate(`/sensors/${run.sensor.id}`)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {run.sensor.name}
                    </button>
                    <p className="text-xs text-gray-400 mt-0.5">{run.sensor.sensorCode}</p>
                  </div>

                  {/* Badge estado */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    run.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {run.status === 'success' ? 'OK' : 'Error'}
                  </span>
                </div>

                {/* Detalles */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(run.startedAt).toLocaleString('es-ES')}</span>
                  <span>{run.recordsProcessed} registros</span>
                </div>

                {/* Error message */}
                {run.errorMessage && (
                  <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    {run.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}