import { useState } from "react";
import { createPatient } from "../api";
import SelectInput from "./SelectInput";

function NewPatientForm({ onSaved }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const today = new Date();
  const maxBirthDate = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const patient = Object.fromEntries(formData.entries());
    if (!patient.gender) {
      setError("Selecciona el sexo del paciente.");
      return;
    }
    patient.external_id = patient.external_id.trim() || null;
    patient.comments = patient.comments.trim() || null;

    try {
      setSaving(true);
      const createdPatient = await createPatient(patient);
      form.reset();
      onSaved(createdPatient.id);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="col patient-create-form" onSubmit={handleSubmit} id="new-patient-form">
      <div className="patient-form-grid">
        <label className="patient-form-field" htmlFor="new-patient-name">
          Nombre completo
          <input type="text" name="name" id="new-patient-name" required maxLength={200} autoComplete="name" />
        </label>
        <div className="patient-form-field">
          <label id="new-patient-gender-label">Sexo</label>
          <SelectInput
            name="gender"
            defaultValue=""
            placeholder="Selecciona el sexo"
            className="patient-select"
            ariaLabel="Sexo"
            options={[
              { value: "female", label: "Femenino" },
              { value: "male", label: "Masculino" },
              // { value: "unspecified", label: "No especificado" },
            ]}
          />
        </div>
        <label className="patient-form-field" htmlFor="new-patient-external-id">
          Identificación o n.º de historia clínica
          <input type="text" name="external_id" id="new-patient-external-id" maxLength={120} />
        </label>
        <label className="patient-form-field" htmlFor="new-patient-birth-date">
          Fecha de nacimiento
          <input type="date" name="date_of_birth" id="new-patient-birth-date" required max={maxBirthDate} />
        </label>
        <fieldset className="patient-option-group">
          <legend>Lado afectado</legend>
          <label>
            <input type="radio" name="affected_side" value="right" required />
            Derecho
          </label>
          <label>
            <input type="radio" name="affected_side" value="left" />
            Izquierdo
          </label>
        </fieldset>
        <fieldset className="patient-option-group">
          <legend>Miembro afectado</legend>
          <label>
            <input type="radio" name="affected_region" value="arm" required />
            Brazo
          </label>
          <label>
            <input type="radio" name="affected_region" value="leg" />
            Pierna
          </label>
        </fieldset>
        <label className="patient-form-field patient-comments-field" htmlFor="new-patient-comments">
        Comentarios adicionales
        <textarea name="comments" id="new-patient-comments" maxLength={2000} rows={4} />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="btn" disabled={saving}>
        {saving ? "Guardando..." : "Guardar paciente"}
      </button>
    </form>
  );
}

export default NewPatientForm;
