/** Small presentational primitives that mirror the design-system components used in the mockup. */

export function Card({ accent = false, variant = 'default', className = '', children, ...rest }) {
  const classes = [
    'card',
    accent ? 'card--accent' : '',
    variant === 'flat' ? 'card--flat' : '',
    variant === 'inverse' ? 'card--inverse' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {variant === 'inverse' && <span className="card__glow" aria-hidden="true" />}
      {children}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Chip({ children }) {
  return <span className="chip">{children}</span>;
}

export function CardLabel({ children, sub }) {
  return (
    <>
      <span className="card__label">{children}</span>
      {sub && <span className="card__sub">{sub}</span>}
    </>
  );
}

export function Field({ label, hint, required = false, children }) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && <span className="field__req"> *</span>}
      </span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Notice({ tone = 'info', children }) {
  return <div className={`notice${tone === 'warn' ? ' notice--warn' : ''}`}>{children}</div>;
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className="toast" role="status">{toast.text}</div>;
}

export function PageHeader({ eyebrow, title, sub, children }) {
  return (
    <div className="page__head">
      <div className="page__titles">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page__title">{title}</h1>
        {sub && <span className="page__sub">{sub}</span>}
      </div>
      {children && <div className="page__tools">{children}</div>}
    </div>
  );
}
