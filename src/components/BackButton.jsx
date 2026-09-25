import { LuArrowLeft } from "react-icons/lu";
import { useNavigate } from "react-router";

function BackButton() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return <button
    type="button"
    className="btn bare"
    onClick={goBack}
    aria-label="Volver"
    title="Volver"
  >
    <LuArrowLeft size={22} />
  </button>;
}

export default BackButton;
