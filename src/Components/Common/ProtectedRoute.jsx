import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { Auth } from "../Firebase/Firebaseconfig";

const ProtectedRoute = ({ children }) => {
  const reduxUser = useSelector((state) => state.user.firebaseUser);
  const authUser = Auth.currentUser;
  const location = useLocation();

  if (!reduxUser && !authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;

