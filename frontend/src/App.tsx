import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Prospects from './pages/Prospects';
import ProspectDetail from './pages/ProspectDetail';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Servicios from './pages/Servicios';
import Agenda from './pages/Agenda';
import Calculadora from './pages/Calculadora';
import EmailPage from './pages/Email';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Inbox from './pages/Inbox';
import Layout from './pages/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AgentPage from './pages/AgentPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas con layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Pipeline (antes Prospectos) */}
        <Route path="pipeline" element={<Prospects />} />
        <Route path="pipeline/:id" element={<ProspectDetail />} />

        {/* Clientes */}
        <Route path="clientes" element={<Clients />} />
        <Route path="clientes/:id" element={<ClientDetail />} />

        {/* Servicios */}
        <Route path="servicios" element={<Servicios />} />

        {/* Redirects de rutas antiguas */}
        <Route path="prospectos" element={<Navigate to="/pipeline" replace />} />
        <Route path="prospectos/:id" element={<ProspectDetailRedirect />} />

        {/* Herramientas */}
        <Route path="mapa" element={<Prospects defaultView="mapa" />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="emails" element={<EmailPage />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="agente" element={<AgentPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Redirect /prospectos/:id to /pipeline/:id
function ProspectDetailRedirect() {
  const id = window.location.pathname.split('/').pop();
  return <Navigate to={`/pipeline/${id}`} replace />;
}
