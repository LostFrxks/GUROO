import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "guroo:test-time";

const formatLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function TestTimeControl() {
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    setOverride(stored);
    const date = new Date(stored);
    if (!Number.isNaN(date.getTime())) {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setInputValue(local);
    }
  }, []);

  const applyOverride = (isoValue: string) => {
    setOverride(isoValue);
    localStorage.setItem(STORAGE_KEY, isoValue);
    window.dispatchEvent(new CustomEvent("guroo:test-time-changed"));
  };

  const clearOverride = () => {
    setOverride(null);
    setInputValue("");
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("guroo:test-time-changed"));
  };

  const handleSetFromInput = () => {
    if (!inputValue) return;
    const date = new Date(inputValue);
    if (Number.isNaN(date.getTime())) return;
    applyOverride(date.toISOString());
  };

  const shiftTime = (minutes: number) => {
    const base = override ? new Date(override) : new Date();
    if (Number.isNaN(base.getTime())) return;
    base.setMinutes(base.getMinutes() + minutes);
    applyOverride(base.toISOString());
    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setInputValue(local);
  };

  const label = useMemo(() => {
    return override ? `Тест-время: ${formatLabel(override)}` : "Тест-время: реальное";
  }, [override]);

  return (
    <div className={`time-debug ${open ? "open" : ""}`}>
      <button type="button" className="time-debug-toggle" onClick={() => setOpen((v) => !v)}>
        ⏱
      </button>
      {open && (
        <div className="time-debug-panel">
          <div className="time-debug-title">{label}</div>
          <div className="time-debug-row">
            <input
              type="datetime-local"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button type="button" onClick={handleSetFromInput}>
              Установить
            </button>
          </div>
          <div className="time-debug-row">
            <button type="button" onClick={() => shiftTime(60)}>
              +1ч
            </button>
            <button type="button" onClick={() => shiftTime(24 * 60)}>
              +1д
            </button>
            <button type="button" onClick={() => shiftTime(-60)}>
              -1ч
            </button>
          </div>
          <div className="time-debug-row">
            <button type="button" className="time-debug-clear" onClick={clearOverride}>
              Сбросить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
