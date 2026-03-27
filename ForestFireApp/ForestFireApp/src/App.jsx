import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

function AppContent() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
