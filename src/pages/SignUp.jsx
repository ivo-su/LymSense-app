import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Logo from "../components/Logo";
import PassInput from "../components/PassInput";
import { signUp } from "../api";

function SignUp({ onSuccess }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    try {
      setLoading(true);
      const response = await signUp(payload);
      onSuccess?.(response.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Logo />
      <form className="col" onSubmit={handleSubmit}>
        <div className="input-container">
          <input type="text" id="name" name="name" placeholder=" " required />
          <label htmlFor="name">Nombre</label>
        </div>
        <div className="input-container">
          <input type="email" id="email" name="email" placeholder=" " required />
          <label htmlFor="email">Correo electrónico</label>
        </div>
        <PassInput name="password" required />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
        {error && <p className="error">{error}</p>}
        <p>
          Ya tengo una cuenta <Link to="/signin">Iniciar sesión</Link>
        </p>
      </form>
    </>
  );
}

export default SignUp;