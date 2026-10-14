import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

const LONG_PRESS_MS = 420;
const INTERACTIVE = 'button, a, input, select, textarea, [role="button"]';

/**
 * Tooltip. Con ratón sigue al cursor. Con el dedo, mantener pulsado muestra la
 * información en una ficha inferior (sin disparar la acción), y un toque
 * corto sobre algo que no es un botón también la muestra.
 */
export function Tip({ content, children, className = '', as: Tag = 'span', delay = 120, wide = false, ...rest }) {
  const [pos, setPos] = useState(null);
  const [pinned, setPinned] = useState(false);
  const timer = useRef(null);
  const press = useRef(null);
  if (!content) return <Tag className={className} {...rest}>{children}</Tag>;
  // Los eventos de la ficha (que vive en un portal) también suben por el árbol
  // de React: solo cuentan los que ocurren dentro del propio elemento.
  const own = (e) => e.currentTarget.contains(e.target);
  const touch = (e) => e.pointerType === 'touch';
  const show = (e) => {
    if (touch(e) || !own(e)) return;
    const { clientX, clientY } = e;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPos({ x: clientX, y: clientY }), delay);
  };
  const move = (e) => {
    if (touch(e)) {
      const p = press.current;
      if (p && !p.fired && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) clearTimeout(p.timer);
      return;
    }
    if (pos) setPos({ x: e.clientX, y: e.clientY });
  };
  const hide = (e) => {
    if (touch(e)) return;
    clearTimeout(timer.current);
    setPos(null);
  };
  const down = (e) => {
    if (!own(e)) return;
    if (!touch(e)) {
      press.current = null;
      return;
    }
    const p = { x: e.clientX, y: e.clientY, fired: false, touch: true };
    p.timer = setTimeout(() => {
      p.fired = true;
      setPinned(true);
      navigator.vibrate?.(8);
    }, LONG_PRESS_MS);
    press.current = p;
  };
  const up = () => clearTimeout(press.current?.timer);
  const clickCapture = (e) => {
    const p = press.current;
    // detail 0: clic de teclado (Enter/Espacio), nunca viene de un toque.
    if (!p || !own(e) || e.detail === 0) return;
    if (p.fired) {
      // El toque largo ya mostró la ficha: no se ejecuta la acción.
      e.preventDefault();
      e.stopPropagation();
      press.current = null;
      return;
    }
    const target = e.target.closest?.(INTERACTIVE);
    if (p.touch && !(target && e.currentTarget.contains(target))) setPinned(true);
  };
  return (
    <Tag
      className={className}
      onPointerEnter={show}
      onPointerMove={move}
      onPointerLeave={hide}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={clickCapture}
      onContextMenu={(e) => press.current?.touch && e.preventDefault()}
      {...rest}
    >
      {children}
      {pos ? <TipBox x={pos.x} y={pos.y} wide={wide}>{content}</TipBox> : null}
      {pinned ? (
        <TouchTip
          onClose={() => {
            press.current = null;
            setPinned(false);
          }}
        >
          {content}
        </TouchTip>
      ) : null}
    </Tag>
  );
}

/**
 * Ficha de información para pantallas táctiles: se cierra con un toque nuevo.
 * Al soltar el dedo del toque largo que la abrió llega un clic que no cuenta.
 */
function TouchTip({ children, onClose }) {
  const armed = useRef(false);
  return createPortal(
    <div
      className="touchtip-backdrop"
      onPointerDown={() => {
        armed.current = true;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (armed.current) onClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="touchtip" role="tooltip">
        {children}
        <div className="touchtip-close tiny">Toca para cerrar</div>
      </div>
    </div>,
    document.body,
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

/**
 * Aviso temporal con el último error de reglas. Cada error nuevo (objeto
 * distinto en el estado) lo muestra; se oculta solo, aunque después lleguen
 * acciones correctas que limpien el error del estado.
 */
export function Toast({ error }) {
  const [visible, setVisible] = useState(null);
  useEffect(() => {
    if (error) setVisible(error);
  }, [error]);
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => setVisible(null), 2400);
    return () => clearTimeout(t);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="toast" role="alert" key={visible.at ?? visible.id}>
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
