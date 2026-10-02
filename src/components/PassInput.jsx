import { useState } from "react";

function PassInput(props){
  const [peek, setPeek] = useState(false);



  return (
    <div className="input-container pass-input">
      <input
        type={peek ? "text" : "password"}
        id="password"
        placeholder=" "
        {...props}
      />
      <label htmlFor="password">Contraseña</label>
      <p onClick={() => {
          setPeek(!peek)
        }
      }>
        {peek ? "Ocultar" : "Mostrar"}
      </p>
    </div>
  );
}

export default PassInput;