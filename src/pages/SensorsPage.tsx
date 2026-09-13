import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

interface Sensor {
  id: string;
  name: string;
  sensorCode: string;
  type: 'HTTP_POLL' | 'MANUAL_UPLOAD';
  status: 'active' | 'paused';
  url?: string;
  createdAt: string;
}

interface SensorForm {
  name: string;
  sensorCode: string;
  type: 'HTTP_POLL' | 'MANUAL_UPLOAD';
  status: 'active' | 'paused';
  url: string;
}

const emptySensorForm: SensorForm = {
  name: '',
  sensorCode: '',
  type: 'MANUAL_UPLOAD',
  status: 'active',
  url: '',
};

export default function SensorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [form, setForm] = useState<SensorForm>(emptySensorForm);
  const [error, setError] = useState('');

  // Obtener lista de sensores
  const { data: sensors = [], isLoading } = useQuery<Sensor[]>({
    queryKey: ['sensors'],
    queryFn: async () => {
      const { data } = await api.get('/getSensorsAll');
      return data;
    },
  });

  // Crear sensor
  const createMutation = useMutation({
    mutationFn: (dto: SensorForm) => api.post('/createSensor', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
      resetForm();
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error al crear sensor');
      } else {
        setError('Error desconocido');
      }
    },
  });

  // Actualizar sensor
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<SensorForm> }) =>
      api.patch(`/updateSensor/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
      resetForm();
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Error al crear sensor');
      } else {
        setError('Error desconocido');
      }
    },
  });

  // Eliminar sensor
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/deleteSensor/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sensors'] }),
  });

  // Activar/pausar sensor
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) =>
      api.patch(`/updateSensor/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sensors'] }),
  });

  const resetForm = () => {
    setForm(emptySensorForm);
    setEditingSensor(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setForm({
      name: sensor.name,
      sensorCode: sensor.sensorCode,
      type: sensor.type,
      status: sensor.status,
      url: sensor.url ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const dto = form.type === 'MANUAL_UPLOAD' ? { ...form, url: undefined } : form;
    if (editingSensor) {
      const { ...updateDto } = dto;
      updateMutation.mutate({ id: editingSensor.id, dto: updateDto });
    } else {
      createMutation.mutate(dto as SensorForm);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Smart City</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ingestions')}
            className="text-sm text-blue-600 hover:underline"
          >
            Ingestas
          </button>
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button
            onClick={() => logout()}
            className="text-sm text-red-500 hover:underline"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Título + botón nuevo */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Sensores</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Nuevo
          </button>
        </div>

        {/* Formulario crear/editar */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
            <h3 className="font-medium text-gray-800">
              {editingSensor ? 'Editar sensor' : 'Nuevo sensor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre (mín. 3 caracteres)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={3}
              />
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Código (ej: TEMP-001)"
                value={form.sensorCode}
                onChange={(e) => setForm({ ...form, sensorCode: e.target.value })}
                required
                minLength={3}
                disabled={!!editingSensor} // no se puede cambiar el código al editar
              />
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as SensorForm['type'] })}
              >
                <option value="MANUAL_UPLOAD">Manual Upload</option>
                <option value="HTTP_POLL">HTTP Poll</option>
              </select>
              {form.type === 'HTTP_POLL' && (
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="URL (ej: http://localhost:3000/api/mock/temp-format-a)"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              )}
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-gray-500 hover:underline px-3 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de sensores */}
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-8">Cargando...</p>
        ) : sensors.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No hay sensores. Crea uno.</p>
        ) : (
          <div className="space-y-2">
            {sensors.map((sensor) => (
              <div
                key={sensor.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                {/* Nombre y código */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      onClick={() => navigate(`/sensors/${sensor.id}`)}
                      className="font-medium text-blue-600 hover:underline text-left"
                    >
                      {sensor.name}
                    </button>
                    <p className="text-xs text-gray-500 mt-0.5">{sensor.sensorCode} · {sensor.type}</p>
                  </div>
                  {/* Badge estado */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    sensor.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {sensor.status === 'active' ? 'Activo' : 'Pausado'}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(sensor)}
                    className="text-xs text-gray-600 hover:text-blue-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({
                      id: sensor.id,
                      status: sensor.status === 'active' ? 'paused' : 'active',
                    })}
                    className="text-xs text-gray-600 hover:text-blue-600"
                  >
                    {sensor.status === 'active' ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar ${sensor.name}?`)) {
                        deleteMutation.mutate(sensor.id);
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}