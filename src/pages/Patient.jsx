import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import LineGraph from '../components/LineGraph';
import LogItem from '../components/LogItem';
import Modal from '../components/Modal';
import BackButton from '../components/BackButton';
import PatientCsvImportForm from '../components/PatientCsvImportForm';
import { getFixedReferenceRatios, getSessionReferenceRatios } from '../components/lineGraphData';
import { deleteLog, getAccountProfile, getPatient, setLogReference } from '../api';
import { LuCirclePlus, LuFileText } from 'react-icons/lu';
import { isTauri } from '@tauri-apps/api/core';

function formatReportImpedance(value) {
  const impedance = Number(value);
  if (value == null || !Number.isFinite(impedance)) {
    return { text: "Sin datos", ohms: false };
  }
  return { text: String(impedance), ohms: true };
}

function formatReportRatio(reference, affected) {
  const referenceValue = Number(reference);
  const affectedValue = Number(affected);
  if (
    reference == null
    || affected == null
    || !Number.isFinite(referenceValue)
    || !Number.isFinite(affectedValue)
    || affectedValue === 0
  ) {
    return "Sin datos";
  }
  return (referenceValue / affectedValue).toFixed(2);
}

function generatePatientReport(jsPDF, patient, doctor, generatedAt, sexLabel, affectedLimb, birthOrAge) {
  const pdf = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const bottomMargin = 17;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height) => {
    if (y + height > pageHeight - bottomMargin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addSectionTitle = (title) => {
    ensureSpace(12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title, margin, y);
    y += 7;
  };

  const addDetail = (label, value) => {
    const valueLines = pdf.splitTextToSize(String(value || "Sin datos"), contentWidth - 48);
    const rowHeight = Math.max(5, valueLines.length * 4.5);
    ensureSpace(rowHeight);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(label, margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(valueLines, margin + 48, y);
    y += rowHeight + 1;
  };

  const doctorName = doctor.medical_credentials
    ? `${doctor.medical_credentials} ${doctor.name}`
    : doctor.name;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Informe del paciente", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Generado: ${generatedAt.toLocaleString("es-AR")}`, margin, y);
  y += 7;

  addSectionTitle("Profesional");
  [
    ["Nombre", doctorName],
    ["Especialidad", doctor.specialty],
    ["Matrícula", doctor.license_number
      ? `${doctor.license_number}${doctor.license_jurisdiction ? ` (${doctor.license_jurisdiction})` : ""}`
      : null],
    ["Institución", doctor.clinic_name],
    ["Dirección", doctor.clinic_address],
    ["Teléfono", doctor.phone],
    ["Correo", doctor.contact_email || doctor.email],
  ].forEach(([label, value]) => {
    if (value) addDetail(label, value);
  });

  y += 3;
  addSectionTitle("Datos del paciente");
  [
    ["Nombre", patient.name],
    ["ID interno", patient.id],
    ["Sexo", sexLabel],
    ["Fecha de nacimiento / edad", birthOrAge],
    ["N.º de historia clínica", patient.external_id],
    ["Miembro afectado", affectedLimb],
    ["Cantidad de registros", patient.logs.length],
    ["Último registro", patient.logs.length
      ? new Date(patient.logs.at(-1).imported_at).toLocaleDateString("es-AR")
      : "Sin registros"],
    ["Comentarios", patient.comments],
  ].forEach(([label, value]) => {
    if (value != null && value !== "") addDetail(label, value);
  });

  y += 3;
  addSectionTitle("Registros y mediciones");
  if (patient.logs.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("No hay registros para este paciente.", margin, y);
    y += 6;
  } else {
    const columns = [
      { title: "N.º", width: 10 },
      { title: "Fecha", width: 30 },
      { title: "Miembro de referencia", width: 52 },
      { title: "Miembro afectado", width: 52 },
      { title: "Ratio", width: 38 },
    ];
    const drawTableHeader = () => {
      pdf.setFillColor(231, 240, 245);
      pdf.rect(margin, y - 4, contentWidth, 7, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      let x = margin;
      columns.forEach((column) => {
        pdf.text(column.title, x + 1, y);
        x += column.width;
      });
      y += 5;
    };

    drawTableHeader();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    patient.logs.forEach((log) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      const referenceImpedance = log.measurements?.find(
        (measurement) => measurement.type === "REF"
      )?.impedance;
      const affectedImpedance = log.measurements?.find(
        (measurement) => measurement.type === "AFE"
      )?.impedance;
      const values = [
        { text: String(log.session_number ?? log.log_number ?? "-"), ohms: false },
        { text: log.imported_at ? new Date(log.imported_at).toLocaleDateString("es-AR") : "Sin fecha", ohms: false },
        formatReportImpedance(referenceImpedance),
        formatReportImpedance(affectedImpedance),
        { text: formatReportRatio(referenceImpedance, affectedImpedance), ohms: false },
      ];
      const wrappedValues = values.map((value, index) =>
        pdf.splitTextToSize(value.text, columns[index].width - 2)
      );
      const lineHeight = 3.5;
      const rowHeight = Math.max(
        7,
        ...wrappedValues.map((lines) => lines.length * lineHeight + 2.5)
      );
      if (ensureSpace(rowHeight)) {
        drawTableHeader();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
      }
      let x = margin;
      wrappedValues.forEach((lines, index) => {
        const contentHeight = lines.length * lineHeight;
        const verticalOffset = (rowHeight - contentHeight) / 2 + 2.5;
        const textX = x + 1;
        const textY = y + verticalOffset;
        pdf.setFont("helvetica", "normal");
        pdf.text(lines, textX, textY);
        if (values[index].ohms) {
          const lastLine = lines.at(-1);
          const symbolX = textX + pdf.getTextWidth(lastLine) + 1;
          const symbolY = textY + (lines.length - 1) * lineHeight;
          pdf.setFont("symbol", "normal");
          pdf.text("W", symbolX, symbolY);
        }
        x += columns[index].width;
      });
      y += rowHeight;
      pdf.setDrawColor(220);
      pdf.line(margin, y - 1, margin + contentWidth, y - 1);
    });
  }

  const totalPages = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(
      "Informe confidencial - información médica",
      margin,
      pageHeight - 8,
    );
    pdf.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const safeName = patient.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "") || "paciente";
  return {
    data: pdf.output("arraybuffer"),
    filename: `informe-${safeName}-${generatedAt.toISOString().slice(0, 10)}.pdf`,
  };
}

function Patient(){
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setError("");
      setIsGeneratingReport(true);
      const [{ jsPDF }, doctor] = await Promise.all([
        import("jspdf"),
        getAccountProfile(),
      ]);
      const generatedAt = new Date();
      const sexLabels = {
        female: "Femenino",
        male: "Masculino",
        unspecified: "No especificado",
      };
      const sexLabel = sexLabels[patient.gender] || "No especificado";
      const affectedLimb = patient.affected_side && patient.affected_region
        ? `${patient.affected_side === "right" ? "Derecho" : "Izquierdo"} ${patient.affected_region === "arm" ? "brazo" : "pierna"}`
        : "Sin datos";
      const birthOrAge = patient.date_of_birth
        ? new Date(`${patient.date_of_birth}T00:00:00`).toLocaleDateString("es-AR")
        : patient.age_years != null ? `${patient.age_years} años` : "Sin datos";
      const report = generatePatientReport(
        jsPDF,
        patient,
        doctor,
        generatedAt,
        sexLabel,
        affectedLimb,
        birthOrAge,
      );
      if (isTauri()) {
        const [{ save }, { writeFile }] = await Promise.all([
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-fs"),
        ]);
        const path = await save({
          defaultPath: report.filename,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        if (!path) return;
        await writeFile(path, new Uint8Array(report.data));
      } else {
        const url = URL.createObjectURL(
          new Blob([report.data], { type: "application/pdf" }),
        );
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = report.filename;
        downloadLink.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (reportError) {
      setError(reportError.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleReference = async (log) => {
    try {
      await setLogReference(log.id);
      setPatient(await getPatient(id));
    } catch (referenceError) {
      setError(referenceError.message);
    }
  };

  const handleDelete = async () => {
    if (!logToDelete) return;

    try {
      setIsDeleting(true);
      await deleteLog(logToDelete.id);
      setPatient(await getPatient(id));
      setLogToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    getPatient(id).then(setPatient).catch((loadError) => setError(loadError.message));
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!patient) return <p>Cargando paciente...</p>;

  const latestLog = patient.logs.at(-1);
  const csvLogs = patient.logs.filter((log) => log.session_number != null);
  const referenceLog = csvLogs.find((log) =>
    log.reference && log.measurements?.some((measurement) => measurement.type === "REF")
  );
  const hasSessionRatios = getSessionReferenceRatios(csvLogs).values.some(Number.isFinite);
  const hasFixedRatios = getFixedReferenceRatios(csvLogs, referenceLog).values.some(Number.isFinite);
  const birthOrAge = patient.date_of_birth
    ? new Date(`${patient.date_of_birth}T00:00:00`).toLocaleDateString("es-AR")
    : patient.age_years != null ? `${patient.age_years} años` : "Sin datos";
  const sexLabels = {
    female: "Femenino",
    male: "Masculino",
    unspecified: "No especificado",
  };
  const affectedLimb = patient.affected_side && patient.affected_region
    ? `${patient.affected_side === "right" ? "Derecho" : "Izquierdo"} ${patient.affected_region === "arm" ? "brazo" : "pierna"}`
    : "Sin datos";

  return (<>
    <div className="box" style={{ display: "flex", justifyContent:"start", alignItems: "center", gap: "1em" }}>
    <BackButton />
    <h1>Historial de {patient.name}</h1>
  </div>

    <div className="patient-overview">
    <div className='box' style={{width:"100%"}}>
      <div className="patient-actions" style={{margin:".5em 0 1.5em 0"}}>
      <h3>Información</h3>
      <button className="btn" type="button" style={{background:"none", border:"none", padding:"0", boxShadow:"none", margin:"0 15px 0 auto"}} onClick={handleGenerateReport} disabled={isGeneratingReport}>
        <LuFileText /> {isGeneratingReport ? "Generando..." : "Generar informe"}
      </button>
      <button className="btn" style={{background:"none", border:"none", padding:"0", boxShadow:"none"}} type="button" onClick={() => setIsLogOpen(true)}>
        <LuCirclePlus /> Cargar mediciones
      </button>
    </div>
      <div className="patient-info">
      <span>Nombre: {patient.name}</span>
      <span>Registros: {patient.logs.length}</span>
      <span>Miembro afectado: {affectedLimb}</span>
      <span>Sexo: {sexLabels[patient.gender] || "No especificado"}</span>
      <span>Último registro: {latestLog ? new Date(latestLog.imported_at).toLocaleDateString("es-AR") : 'Sin registros'}</span>
      <span>N.º de historia clínica: {patient.external_id || "No especificado"}</span>
      </div>
    </div>
    </div>
    <div className="box">
      <h3>Ratios REF / AFE</h3>
      <div className="graph-container">
        {hasSessionRatios || hasFixedRatios
          ? <LineGraph logs={csvLogs} referenceLog={referenceLog} />
          : <p style={{}}>
            No hay datos disponibles. Marca la estrella en una sesión con REF para usarla como referencia fija,
            o agrega una medición REF para calcular el ratio por sesión.
          </p>}
      </div>
    </div>
    <div className="box log-list" >
      {patient.logs.length === 0 && <p>No hay registros para este paciente.</p>}
      {/* {!referenceLog && patient.logs.length > 0 && <p>Marca un registro con z_risk como referencia para ver la segunda serie.</p>} */}
      {patient.logs.map((log) => <LogItem
        key={log.id}
        log={{ ...log, patient_name: patient.name }}
        onDelete={setLogToDelete}
        onReference={log.measurements?.some((measurement) => measurement.type === "REF")
          ? handleReference
          : undefined}
      />)}
    </div>

    <Modal
      isOpen={isLogOpen}
      onClose={() => setIsLogOpen(false)}
      title={`Nuevo registro para ${patient.name}`}
      className="patient-create-modal"
      footer={<button className="btn" type="button" onClick={() => setIsLogOpen(false)}>Cerrar</button>}
    >
      <PatientCsvImportForm
        patient={patient}
        onSaved={async () => {
          setPatient(await getPatient(id));
        }}
      />
    </Modal>

    <Modal
      isOpen={Boolean(logToDelete)}
      onClose={() => !isDeleting && setLogToDelete(null)}
      title="Eliminar registro"
      footer={<>
        <button
          type="button"
          className="btn"
          onClick={() => setLogToDelete(null)}
          disabled={isDeleting}
        >Cancelar</button>
        <button
          type="button"
          className="btn"
          onClick={handleDelete}
          disabled={isDeleting}
        >{isDeleting ? "Eliminando..." : "Eliminar"}</button>
      </>}
    >
      <p>¿Seguro que quieres eliminar este registro?</p>
    </Modal>

  </>)
}

export default Patient;