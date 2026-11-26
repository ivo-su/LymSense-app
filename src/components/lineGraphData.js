function getImpedance(log, type) {
  const measurement = log.measurements?.find((item) => item.type === type);
  if (measurement?.impedance == null) return null;
  const impedance = Number(measurement.impedance);
  return Number.isFinite(impedance) ? impedance : null;
}

function getCsvSessions(logs) {
  return logs
    .filter((log) => log.session_number != null)
    .sort((first, second) =>
      Number(first.session_number) - Number(second.session_number)
      || Number(first.id) - Number(second.id)
    );
}

function getSessionsFromFirstUsableRatio(logs) {
  const sessions = getCsvSessions(logs);
  let previousReference = null;
  const firstRatioIndex = sessions.findIndex((session) => {
    const reference = getImpedance(session, "REF");
    if (reference != null) previousReference = reference;
    const affected = getImpedance(session, "AFE");
    return previousReference != null && affected != null && affected !== 0;
  });

  return firstRatioIndex === -1
    ? { sessions: [], firstRatioIndex: -1 }
    : { sessions, firstRatioIndex };
}

export function getSessionReferenceRatios(logs) {
  let previousReference = null;
  const { sessions, firstRatioIndex } = getSessionsFromFirstUsableRatio(logs);
  const values = sessions.map((session) => {
    const sessionReference = getImpedance(session, "REF");
    if (sessionReference != null) previousReference = sessionReference;
    const affected = getImpedance(session, "AFE");
    return previousReference == null || affected == null || affected === 0
      ? null
      : previousReference / affected;
  });

  return {
    labels: sessions.slice(firstRatioIndex).map((session) => session.session_number),
    values: values.slice(firstRatioIndex),
    logIds: sessions.slice(firstRatioIndex).map((session) => session.id),
  };
}

export function getFixedReferenceRatios(logs, referenceLog) {
  const reference = referenceLog ? getImpedance(referenceLog, "REF") : null;
  const { sessions, firstRatioIndex } = getSessionsFromFirstUsableRatio(logs);
  const values = sessions.map((session) => {
    const affected = getImpedance(session, "AFE");
    return reference == null || affected == null || affected === 0
      ? null
      : reference / affected;
  });

  return {
    labels: sessions.slice(firstRatioIndex).map((session) => session.session_number),
    values: values.slice(firstRatioIndex),
  };
}
