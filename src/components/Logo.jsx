import LogoSrc from "../assets/LymSense.png";


function Logo(){
  return (
    <div className="logo" style={{maxWidth:"500px", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto", padding: "20px"}}>
      <img src={LogoSrc} alt="Logo" width={647} height={188} style={{maxWidth: "100%", height: "auto"}}/>
    </div>
  );
}

export default Logo;