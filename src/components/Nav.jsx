import { LuLogOut, LuUserRound, LuUsers } from "react-icons/lu";
import { Link } from "react-router";

function Nav({ user, onLogout }) {
  return (
    <nav className="main-nav">
      <div>
        <Link to="/">Inicio</Link>
        <Link to="/profile"><LuUserRound /> Mi perfil</Link>
        {user?.role === "admin" && <Link to="/admin/users"><LuUsers /> Usuarios</Link>}
        {/* <Link to="/about">Acerca de</Link> */}
        {/* <Link to="/contact">Contacto</Link> */}
      </div>
      <div>
        {user && (
          <div className="nav-user" aria-label={`Registrado como ${user.name || user.email}`}>
            <span>Registrado como </span>
            <strong>{user.name || user.email}</strong>
          </div>
        )}
        {onLogout && (
          <button type="button" className="btn btn-secondary bare" onClick={onLogout}>
            Cerrar sesión <LuLogOut />
          </button>
        )}
      </div>
    </nav>
  );
}

export default Nav;