import { Link } from "react-router";

function Nav(){
  return (
    <nav className="main-nav">
      <div>
        <Link to="/">Home</Link>
        {/* <Link to="/about">Acerca de</Link> */}
        {/* <Link to="/contact">Contacto</Link> */}
      </div>
      <div>
        {/* <Link to="/signup">Registrarse</Link> */}
      </div>
    </nav>
  )
}

export default Nav;