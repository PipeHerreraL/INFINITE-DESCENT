import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

/** Tooltip flotante que sigue al cursor. */
export function Tip({ content, children, className = '', as: Tag = 'span', delay = 120, wide = false, ...rest }) {
  const [pos, setPos] = useState(null);
  const timer = useRef(null);
  if (!content) return <Tag className={className} {...rest}>{children}</Tag>;
  const show = (e) => {
    const { clientX, clientY } = e;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPos({ x: clientX, y: clientY }), delay);
  };
  const move = (e) => {
    if (pos) setPos({ x: e.clientX, y: e.clientY });
  };
  const hide = () => {
    clearTimeout(timer.current);
    setPos(null);
  };
  return (
    <Tag className={className} onMouseEnter={show} onMouseMove={move} onMouseLeave={hide} {...rest}>
      {children}
      {pos ? <TipBox x={pos.x} y={pos.y} wide={wide}>{content}</TipBox> : null}
    </Tag>
  );
}

function TipBox({ x, y, children, wide }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ left: x + 16, top: y + 16, opacity: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x + 16;
    let top = y + 16;
    if (left + r.width > vw - 8) left = Math.max(8, x - r.width - 16);
    if (top + r.height > vh - 8) top = Math.max(8, vh - r.height - 8);
    setStyle({ left, top, opacity: 1 });
  }, [x, y]);
  return createPortal(
    <div ref={ref} className={`tipbox ${wide ? 'wide' : ''}`} style={style} role="tooltip">
      {children}
    </div>,
    document.body,
  );
}

export function Modal({ title, onClose, children, wide = false, className = '' }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal panel ${wide ? 'modal-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose ? (
            <button type="button" className="btn btn-parchment btn-sm" onClick={onClose} aria-label="Cerrar">
              <Icon name="close" size={16} /> Cerrar <span className="kbd">Esc</span>
            </button>
          ) : null}
        </div>
        <div className="modal-body scroll">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Aviso temporal con el último error de reglas. */
export function Toast({ error }) {
  const [visible, setVisible] = useState(null);
  useEffect(() => {
    if (!error) return undefined;
    setVisible(error);
    const t = setTimeout(() => setVisible(null), 2800);
    return () => clearTimeout(t);
  }, [error?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  return (
    <div className="toast" role="alert">
      <Icon name="info" size={18} /> {visible.message}
    </div>
  );
}

export function Bar({ value, max, color = 'var(--hp)', extra = 0, extraColor = 'var(--shield)', height = 10, label = true }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const extraPct = max > 0 ? Math.max(0, Math.min(100 - pct, (extra / max) * 100)) : 0;
  return (
    <div className="bar" style={{ height }}>
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      {extra > 0 ? <div className="bar-extra" style={{ left: `${pct}%`, width: `${extraPct}%`, background: extraColor }} /> : null}
      {label ? (
        <span className="bar-label">
          {Math.round(value)}/{max}
          {extra > 0 ? ` +${extra}` : ''}
        </span>
      ) : null}
    </div>
  );
}

export function Currency({ icon, value, label, color }) {
  return (
    <Tip content={label} className="currency">
      <Icon name={icon} size={18} color={color} /> <b>{value}</b>
    </Tip>
  );
}
