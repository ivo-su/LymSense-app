import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { getAccountProfile, updateAccountProfile } from "../api";

const profileFields = [
  { name: "medical_credentials", label: "Credenciales médicas", placeholder: "Médico/a, Doctor/a", maxLength: 200 },
  { name: "specialty", label: "Especialidad", placeholder: "Especialidad médica", maxLength: 160 },
  { name: "license_number", label: "Número de matrícula", placeholder: "Número de matrícula profesional", maxLength: 120 },
  { name: "license_jurisdiction", label: "Jurisdicción de la matrícula", placeholder: "Provincia o país", maxLength: 120 },
  { name: "clinic_name", label: "Clínica u hospital", placeholder: "Nombre de la institución", maxLength: 200 },
  { name: "phone", label: "Teléfono profesional", placeholder: "Número de teléfono", maxLength: 60 },
  { name: "contact_email", label: "Correo de contacto para informes", placeholder: "Correo electrónico", type: "email", maxLength: 255 },
];

function Profile({ onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setError("");
        setProfile(await getAccountProfile());
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timeoutId = window.setTimeout(() => setNotice(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setNotice("");
      const updatedProfile = await updateAccountProfile(profile);
      setProfile(updatedProfile);
      onProfileUpdated?.(updatedProfile);
      setNotice("Perfil guardado");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="box" style={{ display: "flex", alignItems: "center", gap: "1em" }}>
        <BackButton />
        <h1>Perfil profesional</h1>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <section className="box"><p>Cargando perfil...</p></section>}
      {!loading && profile && (
        <form className="profile-form" onSubmit={handleSubmit}>
          <section className="box profile-section">
            <h2>Datos de la cuenta</h2>
            <div className="profile-grid">
              <label className="profile-field" htmlFor="profile-name">
                Nombre
                <input
                  id="profile-name"
                  name="name"
                  value={profile.name || ""}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  autoComplete="name"
                />
              </label>
              <label className="profile-field" htmlFor="profile-email">
                Correo electrónico de acceso
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={handleChange}
                  required
                  maxLength={255}
                  autoComplete="email"
                />
              </label>
            </div>
          </section>
          <section className="box profile-section">
            <h2>Información profesional</h2>
            <div className="profile-grid">
              {profileFields.map((field) => (
                <label className="profile-field" htmlFor={`profile-${field.name}`} key={field.name}>
                  {field.label}
                  <input
                    id={`profile-${field.name}`}
                    name={field.name}
                    type={field.type || "text"}
                    value={profile[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    autoComplete="off"
                  />
                </label>
              ))}
              <label className="profile-field" htmlFor="profile-clinic-address">
                Dirección de la clínica u hospital
                <input
                  id="profile-clinic-address"
                  name="clinic_address"
                  value={profile.clinic_address || ""}
                  onChange={handleChange}
                  maxLength={500}
                  autoComplete="street-address"
                />
              </label>
            </div>
          </section>
          {/* {notice && <p role="status">{notice}</p>} */}
          <button type="submit" className="btn" disabled={saving} style={{margin: "0 0 0 auto"}}>
            {saving ? "Guardando..." : notice || "Guardar perfil"}
          </button>
        </form>
      )}
    </>
  );
}

export default Profile;
