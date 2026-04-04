import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";

function AppContent() {
  const { user } = useAuth();
  return user ? <DashboardScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
