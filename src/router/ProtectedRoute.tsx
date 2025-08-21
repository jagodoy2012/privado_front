import { Navigate, useLocation } from 'react-router-dom';
import { getStoredToken, isTokenExpired, clearStoredToken } from '../auth/helpers/token';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getStoredToken();
  const location = useLocation();

  if (!token || isTokenExpired(token)) {
    clearStoredToken();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
