import SalesAnalyticsDashboard from '../components/SalesAnalyticsDashboard';
import { HiOutlineTrendingUp } from 'react-icons/hi';

export default function Reports() {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiOutlineTrendingUp className="w-6 h-6 text-primary-600" />
            Reportes y Análisis
          </h1>
          <p className="text-gray-500 mt-1">
            Visualiza métricas de ventas, efectividad y desempeño de tu equipo
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.open('/api/analytics/export/excel', '_blank')}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 Descargar Excel
          </button>
          <button
            onClick={() => window.open('/api/analytics/export/pdf', '_blank')}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            📄 Descargar PDF
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <SalesAnalyticsDashboard />
    </div>
  );
}
