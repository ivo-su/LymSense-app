import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import Modal from "../components/Modal";
import {
  createManagedUser,
  deleteManagedUser,
  getUsers,
  updateManagedUserStatus,
} from "../api";
import { LuLock, LuLockOpen, LuTrash2 } from "react-icons/lu";

function Accounts({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingOnAccount, setActingOnAccount] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const loadUsers = async () => {
    try {
      setError("");
      setUsers(await getUsers());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setSaving(true);
      setError("");
      setNotice("");
      await createManagedUser({ ...Object.fromEntries(formData.entries()), role });
      form.reset();
      setRole("user");
      setNotice("Cuenta creada.");
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (account) => {
    setError("");
    setPendingAction({ type: "toggle", account });
  };

  const handleDelete = async (account) => {
    setError("");
    setPendingAction({ type: "delete", account });
  };

  const confirmAccountAction = async () => {
    if (!pendingAction) return;
    const { account, type } = pendingAction;
    const nextActive = !account.is_active;
    try {
      setActingOnAccount(true);
      setError("");
      setNotice("");
      if (type === "delete") {
        await deleteManagedUser(account.id);
        setNotice("Cuenta eliminada.");
      } else {
        await updateManagedUserStatus(account.id, nextActive);
        setNotice(`Cuenta ${nextActive ? "habilitada" : "deshabilitada"}.`);
      }
      setPendingAction(null);
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActingOnAccount(false);
    }
  };

  return (
    <>
      <div className="box" style={{ display: "flex", alignItems: "center", gap: "1em" }}>
        <BackButton />
        <h1>Gestión de Cuentas</h1>
      </div>
      <section className="box accounts-create">
        <h2>Crear cuenta</h2>
        <form className="col accounts-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <input type="text" id="account-name" name="name" placeholder=" " required maxLength={200} />
            <label htmlFor="account-name">Nombre</label>
          </div>
          <div className="input-container">
            <input type="email" id="account-email" name="email" placeholder=" " required maxLength={255} />
            <label htmlFor="account-email">Correo electrónico</label>
          </div>
          <div className="input-container">
            <input type="password" id="account-password" name="password" placeholder=" " required minLength={8} maxLength={255} />
            <label htmlFor="account-password">Contraseña</label>
          </div>
          <div className="account-role-options">
            <legend>Tipo de cuenta:</legend>
            <label>
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === "user"}
                onChange={() => setRole("user")}
              />
              <span>Usuario normal</span>
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />
              <span>Administrador</span>
            </label>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {/* {notice && <p role="status">{notice}</p>} */}
          <button type="submit" className="btn" style={{margin: "0 auto"}} disabled={saving}>
            {saving ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
      </section>
      <section className="box">
        <h2> Cuentas existentes</h2>
        <div className="account-list">
          {loading && <p>Cargando cuentas...</p>}
          {!loading && users.length === 0 && <p>No hay cuentas disponibles.</p>}
          {users.map((account) => (
            <div className="account-row" key={account.id}>
              <div>
                <p><strong>{account.name}</strong> - {account.role === "admin" ? "Administrador" : "Usuario normal"}</p>
                <p>{account.email}</p>
              </div>
              <div className="account-row-actions">
              <span className={`account-status ${account.is_active ? "is-active" : "is-disabled"}`} style={{marginRight: "auto"}}>
                {account.is_active ? "Activa" : "Deshabilitada"}
              </span>
                {account.id === currentUser.id ? (
                  <span className="account-self">Tu cuenta</span>
                ) : (
                  <>
                    <button
                      type="button"
                      // className="btn btn-secondary account-action"
                      style={{padding: "0.25em", color:"gray", background:"none", border:'none', margin:"0"}}
                      onClick={() => handleToggleStatus(account)}
                      disabled={actingOnAccount}
                      aria-label={`${account.is_active ? "Deshabilitar" : "Habilitar"} cuenta de ${account.name}`}
                      title={account.is_active ? "Deshabilitar cuenta" : "Habilitar cuenta"}
                    >
                      {account.is_active ? <LuLock size={18}/> : <LuLockOpen size={18} />}
                    </button>
                    <button
                      type="button"
                      className=""
                      style={{padding: "0.25em", color:"red", background:"none", border:'none', margin:"0"}}
                      onClick={() => handleDelete(account)}
                      disabled={actingOnAccount}
                      aria-label={`Eliminar cuenta de ${account.name}`}
                    >
                      <LuTrash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={() => !actingOnAccount && setPendingAction(null)}
        title={pendingAction?.type === "delete" ? "Eliminar cuenta" : `${pendingAction?.account.is_active ? "Deshabilitar" : "Habilitar"} cuenta`}
        footer={(
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setPendingAction(null)}
              disabled={actingOnAccount}
            >Cancelar</button>
            <button
              type="button"
              className="btn"
              onClick={confirmAccountAction}
              disabled={actingOnAccount}
            >{actingOnAccount ? "Procesando..." : pendingAction?.type === "delete" ? "Eliminar" : "Confirmar"}</button>
          </>
        )}
      >
        <p>
          {pendingAction?.type === "delete"
            ? `¿Eliminar permanentemente la cuenta de ${pendingAction.account.name}? Esta acción no se puede deshacer.`
            : `¿Deseas ${pendingAction?.account.is_active ? "deshabilitar" : "habilitar"} la cuenta de ${pendingAction?.account.name}?`}
        </p>
        {error && <p className="error" role="alert">{error}</p>}
      </Modal>
    </>
  );
}

export default Accounts;
