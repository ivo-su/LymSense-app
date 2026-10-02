import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Logo from "../components/Logo";
import PassInput from "../components/PassInput";
import { signIn } from "../api";

function SignIn({ onSuccess }) {
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
      const response = await signIn(payload);
      onSuccess?.(response.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Logo />
      <form className="col" onSubmit={handleSubmit}>
        <div className="input-container">
          <input type="email" id="email" name="email" placeholder=" " required />
          <label htmlFor="email">Correo electrónico</label>
        </div>
        <PassInput name="password" required />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
        {error && <p className="error">{error}</p>}
        <p>
          No tengo una cuenta <Link to="/signup">Crear cuenta</Link>
        </p>
      </form>
    </>
  );
}

export default SignIn;