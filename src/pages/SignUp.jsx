import { Link } from "react-router"
import Logo from "../components/Logo"
import PassInput from "../components/PassInput"

function SignUp() {

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    console.log(data);
  }

  return (
    <>
    <Logo/>
    <form className="col" onSubmit={handleSubmit}>
      <div className="input-container">
        <input type="text" id="name" name="name" placeholder=" " />
        <label htmlFor="name">Name</label>
      </div>
      <div className="input-container">
        <input type="email" id="email" name="email" placeholder=" " />
        <label htmlFor="email">Email</label>
      </div>
      <PassInput name="password"/>
      <button type="submit" className="btn">Sign Up</button>
      <p>
        I already have an account <Link to="/signin">Sign In</Link>
      </p>
    </form>
    </>
  )
}

export default SignUp