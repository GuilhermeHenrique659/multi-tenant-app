import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem("user"); // Replace with actual authentication logic

  if (!isAuthenticated) {
    return Navigate({ to: "/login" });
  }

  return <>{children}</>;
};

export default ProtectedRoute;