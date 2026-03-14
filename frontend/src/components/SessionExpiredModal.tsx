import "../styles/session_modal.css";

type Props = {
  open: boolean;
  isWorking?: boolean;
  onExtend: () => void;
  onLogout: () => void;
};

export default function SessionExpiredModal({ open, isWorking, onExtend, onLogout }: Props) {
  if (!open) return null;

  return (
    <div className="session-modal-backdrop" role="dialog" aria-modal="true">
      <div className="session-modal">
        <h3 className="session-modal-title">Сессия закончилась</h3>
        <p className="session-modal-text">
          Чтобы продолжить работу, продлите сессию или выйдите из аккаунта.
        </p>
        <div className="session-modal-actions">
          <button
            type="button"
            className="btn session-modal-btn"
            onClick={onExtend}
            disabled={isWorking}
          >
            Продлить сессию
          </button>
          <button
            type="button"
            className="session-modal-link"
            onClick={onLogout}
            disabled={isWorking}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

