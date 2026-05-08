import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { userInfo } = useAuth();
  return userInfo ? children : <Navigate to="/login" />;
};
export default PrivateRoute;