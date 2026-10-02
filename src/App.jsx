import { useEffect, useState } from "react";
import "./App.css";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Nav from "./components/Nav";
import Patients from "./pages/Patients";
import Logs from "./pages/Logs";
import Patient from "./pages/Patient";
import Accounts from "./pages/Accounts";
import Profile from "./pages/Profile";
import BackButton from "./components/BackButton";
import { getCurrentUser, logoutUser } from "./api";

function ProtectedLayout({ user, onLogout }) {
  return (
    <>
      <Nav user={user} onLogout={onLogout} />
      <div className="content">
        <Outlet />
      </div>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const response = await getCurrentUser();
        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return <main className="container"><div className="box page-title"><h1>Cargando...</h1></div></main>;
  }

  return (
    <HashRouter>
      <main className="container">
        <Routes>
          <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn onSuccess={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUp onSuccess={setUser} />} />
          <Route path="/" element={user ? <ProtectedLayout user={user} onLogout={handleLogout} /> : <Navigate to="/signin" replace />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<div className="box page-title"><BackButton /><h1>Acerca de</h1></div>} />
            <Route path="/contact" element={<div className="box page-title"><BackButton /><h1>Contacto</h1></div>} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<Patient />} />
            <Route path="/admin/users" element={user?.role === "admin" ? <Accounts currentUser={user} /> : <Navigate to="/" replace />} />
            <Route path="/profile" element={<Profile onProfileUpdated={(profile) => setUser((currentUser) => ({ ...currentUser, ...profile }))} />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? "/" : "/signin"} replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
