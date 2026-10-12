import { createContext, useContext, useEffect, useState } from "react";
import { navigate } from "../services/navigation.js";
export const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider value={(message) => setToast({ message })}>
      {children}
      <div id="toast" className={`toast ${toast ? "show" : ""}`} role="status">
        <span id="toastText">{toast?.message}</span>
      </div>
    </ToastContext.Provider>
  );
}
export function Link({ href, children, onClick, ...props }) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey &&
          !props.target
        ) {
          event.preventDefault();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}
export function Badge({ status }) {
  const value = String(status || "none").toLowerCase();
  return (
    <span className={`badge badge-${value} ${value}`}>
      {value.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}
export function PageHead({ title, description, children }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {description && <p className="desc">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Empty({ children = "No records found." }) {
  return (
    <div className="empty-state">
      <div className="t">{children}</div>
    </div>
  );
}
export function Stats({ items }) {
  return (
    <div className="stat-grid">
      {items.map(([label, value]) => (
        <div className="stat-card" key={label}>
          <div className="label">{label}</div>
          <div className="value">{value}</div>
        </div>
      ))}
    </div>
  );
}
export function Field({ label, id, options, textarea, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select id={id} {...props}>
          {options.map((option) => {
            const [value, text] = Array.isArray(option)
              ? option
              : [option, option];
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
      ) : textarea ? (
        <textarea id={id} {...props} />
      ) : (
        <input id={id} {...props} />
      )}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  useEffect(() => {
    function key(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop open"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button
            className="modal-close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
export function Table({ columns, rows, rowKey = (row) => row.id }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={rowKey(row) || index}>
                {columns.map((column) => (
                  <td key={column.label}>
                    {column.render
                      ? column.render(row)
                      : row[column.key] || "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <Empty />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function CsvLink({
  rows,
  name = "campusx-report.csv",
  children = "Export CSV",
  onClick,
}) {
  const text = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\r\n");
  return (
    <a
      className="btn btn-outline"
      href={`data:text/csv;charset=utf-8,${encodeURIComponent(text)}`}
      download={name}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
