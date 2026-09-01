import { Link } from "react-router";

function Nav(){
  return (
    <nav className="main-nav">
      <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div>
        <Link to="/signup">Sign Up</Link>
      </div>
    </nav>
  )
}

export default Nav;