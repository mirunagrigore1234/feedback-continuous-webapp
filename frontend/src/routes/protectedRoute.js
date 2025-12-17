//Middleware frontend pentru protecția rutelor profesor; verifică token-ul JWT 
// și redirecționează dacă nu e valid
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/professor/login" replace />;
  return children;
}

