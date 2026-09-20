/* @ds-bundle: {"format":4,"namespace":"TBGDesignSystem_042a58","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"SectionLabel","sourcePath":"components/core/SectionLabel.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"StatRow","sourcePath":"components/feedback/StatRow.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"ff09ae0237bc","components/core/Button.jsx":"20d56ae1d801","components/core/Card.jsx":"4f7917a6f57e","components/core/Icon.jsx":"afd5247f7687","components/core/IconButton.jsx":"74e3883e3623","components/core/Logo.jsx":"d200acb5c987","components/core/SectionLabel.jsx":"5efd86bb04a3","components/core/Tag.jsx":"6736a3c10ee7","components/feedback/Dialog.jsx":"9255804f362a","components/feedback/StatRow.jsx":"54386f57021b","components/feedback/Toast.jsx":"8eeea1f7a3ef","components/feedback/Tooltip.jsx":"a8dd5b84c2df","components/forms/Checkbox.jsx":"5e2e7d250dc9","components/forms/Field.jsx":"fa6e8ea23a4f","components/forms/Input.jsx":"8f0a34dc4a63","components/forms/Radio.jsx":"935f8f2d9bb0","components/forms/Select.jsx":"39b47540e4d3","components/forms/Switch.jsx":"7580e7b83409","components/forms/Textarea.jsx":"af4ed4536489","components/navigation/Footer.jsx":"c69cd817555d","components/navigation/NavBar.jsx":"308c8decbc78","components/navigation/Tabs.jsx":"23092bc587bc","ui_kits/corporate-site/App.jsx":"17d41c9f67c3","ui_kits/corporate-site/Clients.jsx":"53b2c19528f6","ui_kits/corporate-site/Commitment.jsx":"15c792d150ce","ui_kits/corporate-site/ContactSection.jsx":"74400d51a5fb","ui_kits/corporate-site/Expertise.jsx":"ace6358c95e6","ui_kits/corporate-site/Hero.jsx":"e81cfad5161e","ui_kits/corporate-site/Services.jsx":"dde704b9f767"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TBGDesignSystem_042a58 = window.TBGDesignSystem_042a58 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: ['var(--ink-100)', 'var(--ink-700)'],
  brand: ['var(--surface-brand-soft)', 'var(--tbg-blue-900)'],
  accent: ['#fdeee7', 'var(--cpay-red-700)'],
  success: ['var(--status-success-soft)', 'var(--status-success)'],
  warning: ['var(--status-warning-soft)', '#9a5410'],
  danger: ['var(--status-danger-soft)', 'var(--status-danger)'],
  info: ['var(--status-info-soft)', 'var(--status-info)']
};
function Badge({
  tone = 'neutral',
  solid = false,
  dot = false,
  children,
  style
}) {
  const [soft, fg] = TONES[tone] || TONES.neutral;
  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: '3px var(--space-3)',
      borderRadius: 'var(--radius-pill)',
      background: solid ? fg : soft,
      color: solid ? '#fff' : fg,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-3xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-wide)',
      textTransform: 'uppercase',
      lineHeight: 1.6,
      ...style
    }
  }, dot ? React.createElement('span', {
    key: 'd',
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: solid ? '#fff' : fg
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const TONE = {
  brand: {
    bg: 'var(--surface-brand)',
    fg: 'var(--text-on-brand)',
    bd: 'var(--surface-brand)',
    hoverBg: 'var(--tbg-blue-700)',
    shadow: 'var(--shadow-brand)'
  },
  accent: {
    bg: 'var(--cpay-orange-500)',
    fg: '#fff',
    bd: 'var(--cpay-orange-500)',
    hoverBg: 'var(--cpay-red-600)',
    shadow: 'var(--shadow-accent)'
  },
  ink: {
    bg: 'var(--ink-1000)',
    fg: '#fff',
    bd: 'var(--ink-1000)',
    hoverBg: 'var(--ink-800)',
    shadow: 'var(--shadow-md)'
  }
};
const SIZE = {
  sm: {
    h: 'var(--control-h-sm)',
    px: 'var(--space-4)',
    fs: 'var(--fs-2xs)'
  },
  md: {
    h: 'var(--control-h-md)',
    px: 'var(--space-6)',
    fs: 'var(--fs-xs)'
  },
  lg: {
    h: 'var(--control-h-lg)',
    px: 'var(--space-8)',
    fs: 'var(--fs-sm)'
  }
};
function Button({
  variant = 'primary',
  tone = 'brand',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft,
  iconRight,
  href,
  onClick,
  children,
  style,
  ...rest
}) {
  const t = TONE[tone] || TONE.brand;
  const s = SIZE[size] || SIZE.md;
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    height: s.h,
    padding: '0 ' + s.px,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-display)',
    fontSize: s.fs,
    fontWeight: 'var(--fw-bold)',
    letterSpacing: 'var(--ls-wide)',
    textTransform: 'uppercase',
    textDecoration: 'none',
    borderRadius: 'var(--radius-control)',
    border: 'var(--border-medium) solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'var(--transition-control), transform var(--dur-fast) var(--ease-standard)',
    transform: press && !disabled ? 'var(--press-scale)' : 'none',
    whiteSpace: 'nowrap'
  };
  const skins = {
    primary: {
      background: hover && !disabled ? t.hoverBg : t.bg,
      color: t.fg,
      borderColor: hover && !disabled ? t.hoverBg : t.bd,
      boxShadow: hover && !disabled ? t.shadow : 'none'
    },
    secondary: {
      background: hover && !disabled ? t.bg : 'transparent',
      color: hover && !disabled ? t.fg : t.bg,
      borderColor: t.bd
    },
    ghost: {
      background: hover && !disabled ? 'var(--ink-100)' : 'transparent',
      color: 'var(--text-strong)',
      borderColor: 'transparent'
    },
    link: {
      background: 'transparent',
      color: hover ? 'var(--text-link-hover)' : 'var(--text-link)',
      borderColor: 'transparent',
      padding: 0,
      height: 'auto',
      textDecoration: hover ? 'underline' : 'none',
      textUnderlineOffset: '3px'
    }
  };
  const props = {
    style: {
      ...base,
      ...(skins[variant] || skins.primary),
      ...style
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    onClick: disabled ? undefined : onClick,
    ...rest
  };
  const body = [iconLeft, React.createElement('span', {
    key: 'l'
  }, children), iconRight];
  return href && !disabled ? React.createElement('a', {
    href,
    ...props
  }, body) : React.createElement('button', {
    type: 'button',
    disabled,
    ...props
  }, body);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  variant = 'outline',
  interactive = false,
  padding = 'var(--space-8)',
  accent,
  header,
  footer,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const skins = {
    outline: {
      background: 'var(--surface-card)',
      border: 'var(--border-hairline) solid var(--border-subtle)',
      boxShadow: hover && interactive ? 'var(--shadow-md)' : 'none'
    },
    raised: {
      background: 'var(--surface-card)',
      border: 'var(--border-hairline) solid transparent',
      boxShadow: hover && interactive ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
    },
    flat: {
      background: 'var(--surface-subtle)',
      border: 'var(--border-hairline) solid transparent',
      boxShadow: 'none'
    },
    inverse: {
      background: 'var(--surface-inverse)',
      border: 'var(--border-hairline) solid transparent',
      color: 'var(--text-inverse)',
      boxShadow: 'none'
    }
  };
  return React.createElement('div', {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: 'var(--radius-card)',
      padding,
      position: 'relative',
      overflow: 'hidden',
      transition: 'var(--transition-lift)',
      transform: hover && interactive ? 'var(--lift-hover)' : 'none',
      ...(skins[variant] || skins.outline),
      ...style
    },
    ...rest
  }, accent ? React.createElement('span', {
    key: 'a',
    style: {
      position: 'absolute',
      insetInlineStart: 0,
      insetBlockStart: 0,
      width: '100%',
      height: 'var(--rule-accent)',
      background: accent === 'cpay' ? 'var(--gradient-cpay)' : 'var(--gradient-orbit)'
    }
  }) : null, header ? React.createElement('div', {
    key: 'h',
    style: {
      marginBottom: 'var(--space-4)'
    }
  }, header) : null, children, footer ? React.createElement('div', {
    key: 'f',
    style: {
      marginTop: 'var(--space-6)',
      paddingTop: 'var(--space-4)',
      borderTop: 'var(--border-hairline) solid var(--border-subtle)'
    }
  }, footer) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/** Thin wrapper over the Lucide CDN sprite (see readme.md > Iconography).
 *  Requires <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.js"> on the page. */
function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  color = 'currentColor',
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) window.lucide.createIcons({
      nameAttr: 'data-lucide',
      attrs: {
        width: size,
        height: size,
        'stroke-width': strokeWidth
      }
    });
  }, [name, size, strokeWidth]);
  return React.createElement('i', {
    ref,
    'data-lucide': name,
    style: {
      display: 'inline-flex',
      width: size,
      height: size,
      color,
      flex: '0 0 auto',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
const SIZE = {
  sm: 30,
  md: 38,
  lg: 46
};
function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const d = SIZE[size] || SIZE.md;
  const skins = {
    solid: {
      background: hover ? 'var(--tbg-blue-700)' : 'var(--surface-brand)',
      color: '#fff',
      borderColor: 'transparent'
    },
    outline: {
      background: hover ? 'var(--surface-brand-soft)' : 'transparent',
      color: 'var(--text-brand)',
      borderColor: 'var(--border-brand)'
    },
    ghost: {
      background: hover ? 'var(--ink-100)' : 'transparent',
      color: 'var(--text-strong)',
      borderColor: 'transparent'
    }
  };
  return React.createElement('button', {
    type: 'button',
    'aria-label': label,
    title: label,
    disabled,
    onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: d,
      height: d,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'var(--border-medium) solid transparent',
      borderRadius: 'var(--radius-control)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'var(--transition-control)',
      padding: 0,
      ...(skins[variant] || skins.ghost),
      ...style
    },
    ...rest
  }, icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
const FILES = {
  tbg: 'assets/logos/tbg-logo-primary.png',
  cpay: 'assets/logos/cpay-mark.png',
  legacy: 'assets/logos/tbg-eye-legacy.jpg'
};
function Logo({
  brand = 'tbg',
  height = 44,
  basePath = '',
  href,
  alt,
  style
}) {
  const src = (basePath ? basePath.replace(/\/$/, '') + '/' : '') + FILES[brand];
  const img = React.createElement('img', {
    src,
    alt: alt || (brand === 'cpay' ? 'Cpay' : 'Thipparath Business Group Co.,Ltd.'),
    style: {
      height,
      width: 'auto',
      display: 'block',
      ...style
    }
  });
  return href ? React.createElement('a', {
    href,
    style: {
      display: 'inline-block'
    }
  }, img) : img;
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionLabel.jsx
try { (() => {
function SectionLabel({
  index,
  children,
  align = 'start',
  rule = true,
  tone = 'default',
  style
}) {
  const fg = tone === 'inverse' ? 'rgba(255,255,255,.72)' : 'var(--text-muted)';
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      gap: 'var(--space-3)',
      ...style
    }
  }, index ? React.createElement('span', {
    key: 'i',
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'var(--fw-black)',
      color: tone === 'inverse' ? '#fff' : 'var(--tbg-blue-900)',
      lineHeight: 1
    }
  }, index) : null, React.createElement('span', {
    key: 't',
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--type-eyebrow-size)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--type-eyebrow-tracking)',
      textTransform: 'uppercase',
      color: fg
    }
  }, children), rule ? React.createElement('span', {
    key: 'r',
    style: {
      width: 56,
      height: 'var(--rule-accent)',
      background: 'var(--gradient-orbit)'
    }
  }) : null);
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  children,
  onRemove,
  interactive = false,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return React.createElement('span', {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: '4px var(--space-3)',
      border: 'var(--border-hairline) solid ' + (hover && interactive ? 'var(--border-brand)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-sm)',
      background: hover && interactive ? 'var(--surface-brand-soft)' : 'var(--surface-page)',
      color: 'var(--text-body)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--fs-2xs)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'var(--transition-control)',
      ...style
    }
  }, children, onRemove ? React.createElement('button', {
    key: 'x',
    type: 'button',
    onClick: onRemove,
    'aria-label': 'Remove',
    style: {
      border: 0,
      background: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      padding: 0,
      lineHeight: 1,
      fontSize: 14
    }
  }, '\u00d7') : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = false,
  title,
  description,
  onClose,
  footer,
  width = 520,
  children
}) {
  if (!open) return null;
  return React.createElement('div', {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'var(--overlay-scrim)',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-6)'
    }
  }, React.createElement('div', {
    role: 'dialog',
    'aria-modal': 'true',
    onClick: function (e) {
      e.stopPropagation();
    },
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-modal)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    key: 'a',
    style: {
      height: 'var(--rule-accent)',
      background: 'var(--gradient-orbit)'
    }
  }), React.createElement('div', {
    key: 'b',
    style: {
      padding: 'var(--space-8)'
    }
  }, title ? React.createElement('h3', {
    style: {
      fontSize: 'var(--fs-xl)',
      fontWeight: 'var(--fw-bold)'
    }
  }, title) : null, description ? React.createElement('p', {
    style: {
      marginTop: 'var(--space-3)',
      color: 'var(--text-muted)',
      fontSize: 'var(--fs-sm)'
    }
  }, description) : null, children ? React.createElement('div', {
    style: {
      marginTop: 'var(--space-6)'
    }
  }, children) : null), footer ? React.createElement('div', {
    key: 'f',
    style: {
      padding: 'var(--space-5) var(--space-8)',
      background: 'var(--ink-050)',
      borderTop: 'var(--border-hairline) solid var(--border-subtle)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatRow.jsx
try { (() => {
function StatRow({
  stats = [],
  tone = 'default',
  style
}) {
  const inv = tone === 'inverse';
  return React.createElement('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
      gap: 'var(--space-8)',
      ...style
    }
  }, stats.map(function (s, i) {
    return React.createElement('div', {
      key: i,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)'
      }
    }, React.createElement('span', {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-4xl)',
        fontWeight: 'var(--fw-black)',
        letterSpacing: 'var(--ls-mega)',
        lineHeight: 1,
        color: inv ? '#fff' : 'var(--tbg-blue-900)'
      }
    }, s.value), React.createElement('span', {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-3xs)',
        fontWeight: 'var(--fw-bold)',
        letterSpacing: 'var(--ls-wider)',
        textTransform: 'uppercase',
        color: inv ? 'rgba(255,255,255,.6)' : 'var(--text-muted)'
      }
    }, s.label));
  }));
}
Object.assign(__ds_scope, { StatRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const MAP = {
  info: ['var(--status-info)', 'var(--status-info-soft)'],
  success: ['var(--status-success)', 'var(--status-success-soft)'],
  warning: ['#9a5410', 'var(--status-warning-soft)'],
  danger: ['var(--status-danger)', 'var(--status-danger-soft)']
};
function Toast({
  tone = 'info',
  title,
  message,
  onDismiss,
  icon,
  style
}) {
  const [fg, bg] = MAP[tone] || MAP.info;
  return React.createElement('div', {
    role: 'status',
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'flex-start',
      minWidth: 300,
      maxWidth: 420,
      padding: 'var(--space-4) var(--space-5)',
      background: 'var(--surface-card)',
      border: 'var(--border-hairline) solid var(--border-subtle)',
      borderTop: 'var(--border-heavy) solid ' + fg,
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, icon ? React.createElement('span', {
    key: 'i',
    style: {
      color: fg,
      display: 'flex',
      paddingTop: 2
    }
  }, icon) : React.createElement('span', {
    key: 'd',
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: fg,
      marginTop: 7,
      flex: '0 0 auto'
    }
  }), React.createElement('div', {
    key: 't',
    style: {
      flex: 1
    }
  }, title ? React.createElement('div', {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-strong)'
    }
  }, title) : null, message ? React.createElement('div', {
    style: {
      fontSize: 'var(--fs-2xs)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, message) : null), onDismiss ? React.createElement('button', {
    key: 'x',
    type: 'button',
    onClick: onDismiss,
    'aria-label': 'Dismiss',
    style: {
      border: 0,
      background: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 16,
      lineHeight: 1,
      padding: 0
    }
  }, '\u00d7') : null, React.createElement('span', {
    key: 'bg',
    style: {
      display: 'none',
      background: bg
    }
  }));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  label,
  placement = 'top',
  children
}) {
  const [on, setOn] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translate(-50%,-8px)'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translate(-50%,8px)'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translate(-8px,-50%)'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translate(8px,-50%)'
    }
  }[placement];
  return React.createElement('span', {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: function () {
      setOn(true);
    },
    onMouseLeave: function () {
      setOn(false);
    },
    onFocus: function () {
      setOn(true);
    },
    onBlur: function () {
      setOn(false);
    }
  }, children, React.createElement('span', {
    key: 't',
    role: 'tooltip',
    style: {
      position: 'absolute',
      zIndex: 60,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      background: 'var(--ink-1000)',
      color: '#fff',
      fontSize: 'var(--fs-3xs)',
      fontFamily: 'var(--font-body)',
      padding: '5px var(--space-3)',
      borderRadius: 'var(--radius-xs)',
      boxShadow: 'var(--shadow-md)',
      opacity: on ? 1 : 0,
      transition: 'opacity var(--dur-fast) var(--ease-standard)',
      ...pos
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  style
}) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked === undefined ? inner : checked;
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, React.createElement('span', {
    key: 'b',
    style: {
      width: 18,
      height: 18,
      flex: '0 0 auto',
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-xs)',
      border: 'var(--border-medium) solid ' + (on ? 'var(--surface-brand)' : 'var(--border-default)'),
      background: on ? 'var(--surface-brand)' : 'var(--surface-page)',
      transition: 'var(--transition-control)'
    }
  }, on ? React.createElement('svg', {
    width: 11,
    height: 9,
    viewBox: '0 0 11 9',
    key: 'c'
  }, React.createElement('path', {
    d: 'M1 4.6 4 7.5 10 1.2',
    fill: 'none',
    stroke: '#fff',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  })) : null), React.createElement('input', {
    key: 'i',
    type: 'checkbox',
    checked: on,
    disabled,
    onChange: function (e) {
      if (checked === undefined) setInner(e.target.checked);
      if (onChange) onChange(e);
    },
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  style
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...style
    }
  }, label ? React.createElement('label', {
    key: 'l',
    htmlFor,
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-3xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-wider)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label, required ? React.createElement('span', {
    key: 'r',
    style: {
      color: 'var(--status-danger)',
      marginInlineStart: 4
    }
  }, '*') : null) : null, children, error ? React.createElement('span', {
    key: 'e',
    style: {
      fontSize: 'var(--fs-2xs)',
      color: 'var(--status-danger)'
    }
  }, error) : hint ? React.createElement('span', {
    key: 'h',
    style: {
      fontSize: 'var(--fs-2xs)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  size = 'md',
  invalid = false,
  disabled = false,
  prefix,
  suffix,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'sm' ? 'var(--control-h-sm)' : size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h-md)';
  const bd = invalid ? 'var(--status-danger)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      height: h,
      padding: '0 var(--space-4)',
      background: disabled ? 'var(--ink-050)' : 'var(--surface-page)',
      border: 'var(--border-hairline) solid ' + bd,
      borderRadius: 'var(--radius-control)',
      boxShadow: focus ? '0 0 0 3px rgba(0,0,160,.12)' : 'none',
      transition: 'var(--transition-control)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, prefix ? React.createElement('span', {
    key: 'p',
    style: {
      color: 'var(--text-muted)',
      display: 'flex'
    }
  }, prefix) : null, React.createElement('input', {
    key: 'i',
    disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 'none',
      background: 'transparent',
      font: 'inherit',
      fontSize: size === 'sm' ? 'var(--fs-xs)' : 'var(--fs-sm)',
      color: 'var(--text-strong)'
    },
    ...rest
  }), suffix ? React.createElement('span', {
    key: 's',
    style: {
      color: 'var(--text-muted)',
      display: 'flex'
    }
  }, suffix) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  name,
  value,
  checked,
  disabled = false,
  onChange,
  style
}) {
  return React.createElement('label', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, React.createElement('span', {
    key: 'b',
    style: {
      width: 18,
      height: 18,
      flex: '0 0 auto',
      display: 'grid',
      placeItems: 'center',
      borderRadius: '50%',
      border: 'var(--border-medium) solid ' + (checked ? 'var(--surface-brand)' : 'var(--border-default)'),
      background: 'var(--surface-page)',
      transition: 'var(--transition-control)'
    }
  }, checked ? React.createElement('span', {
    key: 'd',
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--surface-brand)'
    }
  }) : null), React.createElement('input', {
    key: 'i',
    type: 'radio',
    name,
    value,
    checked,
    disabled,
    onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  options = [],
  size = 'md',
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'sm' ? 'var(--control-h-sm)' : size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h-md)';
  const bd = invalid ? 'var(--status-danger)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return React.createElement('select', {
    disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      height: h,
      width: '100%',
      padding: '0 var(--space-8) 0 var(--space-4)',
      font: 'inherit',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-strong)',
      appearance: 'none',
      background: (disabled ? 'var(--ink-050)' : 'var(--surface-page)') + " url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%236b6b78' stroke-width='1.75'/></svg>\") no-repeat right 14px center",
      border: 'var(--border-hairline) solid ' + bd,
      borderRadius: 'var(--radius-control)',
      outline: 'none',
      boxShadow: focus ? '0 0 0 3px rgba(0,0,160,.12)' : 'none',
      transition: 'var(--transition-control)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    },
    ...rest
  }, options.map(function (o) {
    var v = typeof o === 'string' ? o : o.value;
    var l = typeof o === 'string' ? o : o.label;
    return React.createElement('option', {
      key: v,
      value: v
    }, l);
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  style
}) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked === undefined ? inner : checked;
  function toggle() {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    if (onChange) onChange(!on);
  }
  return React.createElement('label', {
    onClick: toggle,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, React.createElement('span', {
    key: 't',
    role: 'switch',
    'aria-checked': on,
    style: {
      width: 38,
      height: 22,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      background: on ? 'var(--surface-brand)' : 'var(--ink-300)',
      position: 'relative',
      transition: 'background-color var(--dur-fast) var(--ease-standard)'
    }
  }, React.createElement('span', {
    key: 'k',
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 19 : 3,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-xs)',
      transition: 'left var(--dur-fast) var(--ease-standard)'
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function Textarea({
  rows = 4,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const bd = invalid ? 'var(--status-danger)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return React.createElement('textarea', {
    rows,
    disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      padding: 'var(--space-3) var(--space-4)',
      font: 'inherit',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-strong)',
      background: disabled ? 'var(--ink-050)' : 'var(--surface-page)',
      border: 'var(--border-hairline) solid ' + bd,
      borderRadius: 'var(--radius-control)',
      outline: 'none',
      resize: 'vertical',
      lineHeight: 'var(--lh-normal)',
      boxShadow: focus ? '0 0 0 3px rgba(0,0,160,.12)' : 'none',
      transition: 'var(--transition-control)',
      ...style
    },
    ...rest
  });
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({
  links = [],
  basePath = '',
  email = 'cs.thipparath@gmail.com',
  tel = '+66 2 946 4299',
  address = '497,499 Ramindra road, Kannayao, Bangkok, THAILAND 10900',
  style
}) {
  const head = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--fs-3xs)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: 'var(--ls-widest)',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,.55)',
    marginBottom: 'var(--space-4)'
  };
  return React.createElement('footer', {
    style: {
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      padding: 'var(--space-20) 0 var(--space-8)',
      ...style
    }
  }, React.createElement('div', {
    key: 'g',
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-page)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
      gap: 'var(--space-12)'
    }
  }, React.createElement('div', {
    key: 'b'
  }, React.createElement('div', {
    style: {
      background: '#fff',
      display: 'inline-block',
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius-sm)'
    }
  }, React.createElement(__ds_scope.Logo, {
    brand: 'tbg',
    height: 46,
    basePath
  })), React.createElement('p', {
    style: {
      marginTop: 'var(--space-5)',
      fontSize: 'var(--fs-2xs)',
      color: 'rgba(255,255,255,.55)',
      maxWidth: '28ch'
    }
  }, 'Thailand based IT business services, delivering through South-East Asia.')), React.createElement('div', {
    key: 'l'
  }, React.createElement('div', {
    style: head
  }, 'Links'), React.createElement('ul', {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, links.map(function (l) {
    var label = typeof l === 'string' ? l : l.label;
    return React.createElement('li', {
      key: label
    }, React.createElement('a', {
      href: typeof l === 'object' && l.href || '#',
      style: {
        color: 'rgba(255,255,255,.82)',
        fontSize: 'var(--fs-sm)',
        textDecoration: 'none'
      }
    }, label));
  }))), React.createElement('div', {
    key: 'c'
  }, React.createElement('div', {
    style: head
  }, 'Stay in touch'), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      fontSize: 'var(--fs-sm)',
      color: 'rgba(255,255,255,.82)'
    }
  }, React.createElement('a', {
    href: 'mailto:' + email,
    style: {
      color: 'rgba(255,255,255,.82)',
      textDecoration: 'none'
    }
  }, email), React.createElement('span', null, 'Tel: ' + tel), React.createElement('span', {
    style: {
      color: 'rgba(255,255,255,.55)'
    }
  }, address)))), React.createElement('div', {
    key: 'c2',
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-10) var(--gutter-page) 0',
      marginTop: 'var(--space-10)',
      borderTop: '1px solid rgba(255,255,255,.14)',
      fontSize: 'var(--fs-3xs)',
      color: 'rgba(255,255,255,.45)'
    }
  }, '\u00a9 2026 by Thipparath Business Group Co.,Ltd.'));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
function NavBar({
  items = [],
  active,
  onNavigate,
  basePath = '',
  action,
  sticky = true,
  style
}) {
  return React.createElement('header', {
    style: {
      position: sticky ? 'sticky' : 'static',
      top: 0,
      zIndex: 40,
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'var(--blur-veil)',
      borderBottom: 'var(--border-hairline) solid var(--border-subtle)',
      ...style
    }
  }, React.createElement('div', {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-4) var(--gutter-page)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-10)'
    }
  }, React.createElement(__ds_scope.Logo, {
    key: 'l',
    brand: 'tbg',
    height: 42,
    basePath
  }), React.createElement('nav', {
    key: 'n',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-8)',
      marginInlineStart: 'auto'
    }
  }, items.map(function (it) {
    var label = typeof it === 'string' ? it : it.label;
    var isOn = active === label;
    return React.createElement('a', {
      key: label,
      href: typeof it === 'object' && it.href || '#',
      onClick: function (e) {
        e.preventDefault();
        if (onNavigate) onNavigate(label);
      },
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-2xs)',
        fontWeight: 'var(--fw-bold)',
        letterSpacing: 'var(--ls-wider)',
        textTransform: 'uppercase',
        color: isOn ? 'var(--text-strong)' : 'var(--text-muted)',
        textDecoration: 'none',
        paddingBottom: 3,
        borderBottom: 'var(--border-medium) solid ' + (isOn ? 'var(--tbg-blue-900)' : 'transparent'),
        transition: 'var(--transition-control)'
      }
    }, label);
  })), action ? React.createElement('div', {
    key: 'a'
  }, action) : null));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  variant = 'underline',
  style
}) {
  const under = variant === 'underline';
  return React.createElement('div', {
    role: 'tablist',
    style: {
      display: 'flex',
      gap: under ? 'var(--space-8)' : 'var(--space-1)',
      borderBottom: under ? 'var(--border-hairline) solid var(--border-subtle)' : 'none',
      padding: under ? 0 : 'var(--space-1)',
      background: under ? 'transparent' : 'var(--ink-050)',
      borderRadius: under ? 0 : 'var(--radius-sm)',
      ...style
    }
  }, items.map(function (it) {
    var label = typeof it === 'string' ? it : it.label;
    var on = value === label;
    return React.createElement('button', {
      key: label,
      role: 'tab',
      'aria-selected': on,
      type: 'button',
      onClick: function () {
        if (onChange) onChange(label);
      },
      style: {
        border: 0,
        cursor: 'pointer',
        background: under ? 'transparent' : on ? 'var(--surface-page)' : 'transparent',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-2xs)',
        fontWeight: 'var(--fw-bold)',
        letterSpacing: 'var(--ls-wide)',
        textTransform: 'uppercase',
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        padding: under ? '0 0 var(--space-3)' : 'var(--space-2) var(--space-5)',
        borderRadius: under ? 0 : 'var(--radius-xs)',
        boxShadow: !under && on ? 'var(--shadow-xs)' : 'none',
        borderBottom: under ? 'var(--border-medium) solid ' + (on ? 'var(--tbg-blue-900)' : 'transparent') : 'none',
        marginBottom: under ? -1 : 0,
        transition: 'var(--transition-control)'
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/App.jsx
try { (() => {
const {
  NavBar,
  Footer,
  Button,
  Dialog,
  Field,
  Input,
  Toast
} = window.TBGDesignSystem_042a58;
function App() {
  const [page, setPage] = React.useState('Home');
  const [demo, setDemo] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  const base = '../..';
  const NAV = ['Home', 'About', 'Product', 'Our clients', 'Contact'];
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  function go(label) {
    setPage(label);
    const id = {
      About: 'about',
      Product: 'product',
      Contact: 'contact',
      'Our clients': 'clients'
    }[label];
    const el = id && document.getElementById(id);
    if (el) window.scrollTo({
      top: el.offsetTop - 70,
      behavior: 'smooth'
    });else window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NavBar, {
    basePath: base,
    items: NAV,
    active: page,
    onNavigate: go,
    action: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => setDemo(true)
    }, "Demo")
  }), /*#__PURE__*/React.createElement(Hero, {
    onCta: () => setDemo(true)
  }), /*#__PURE__*/React.createElement(Expertise, {
    basePath: base
  }), /*#__PURE__*/React.createElement(Commitment, null), /*#__PURE__*/React.createElement(Clients, null), /*#__PURE__*/React.createElement(Services, null), /*#__PURE__*/React.createElement(ContactSection, {
    onSent: () => {
      setToast(true);
      setTimeout(() => setToast(false), 3200);
    }
  }), /*#__PURE__*/React.createElement(Footer, {
    basePath: base,
    links: NAV
  }), /*#__PURE__*/React.createElement(Dialog, {
    open: demo,
    title: "Request a demo",
    description: "Tell us where to send it. We reply within one business day.",
    onClose: () => setDemo(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setDemo(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setDemo(false);
        setToast(true);
        setTimeout(() => setToast(false), 3200);
      }
    }, "Send request"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Work email",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    placeholder: "you@company.co.th"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Company"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Company name"
  })))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Enquiry sent",
    message: "Our team will be in touch shortly.",
    onDismiss: () => setToast(false)
  })));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/Clients.jsx
try { (() => {
const {
  SectionLabel,
  Card
} = window.TBGDesignSystem_042a58;

/* The public site lists an "Our clients" section but publishes no client names or
   logos. Left deliberately empty rather than inventing partners. */
function Clients() {
  return /*#__PURE__*/React.createElement("section", {
    id: "clients",
    style: {
      padding: 'var(--section-y-tight) 0',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-page)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Our clients"), /*#__PURE__*/React.createElement(Card, {
    variant: "flat",
    style: {
      marginTop: 'var(--space-8)',
      display: 'grid',
      placeItems: 'center',
      minHeight: 150,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-muted)',
      maxWidth: '52ch'
    }
  }, "Client logos not supplied. Drop approved marks into ", /*#__PURE__*/React.createElement("code", null, "assets/clients/"), " and lay them out on a single row at equal optical height."))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/Clients.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/Commitment.jsx
try { (() => {
const {
  SectionLabel,
  StatRow,
  Icon
} = window.TBGDesignSystem_042a58;
const PILLARS = [{
  icon: 'book-open',
  title: 'Our story',
  body: 'Thipparath Business Group Co.,Ltd (TBG) is Thailand based IT business services company, outstanding delivery through South-East Asia. We combine specific industry knowledge with a board range of client experiences to to facilitate the ongoing evolution of our clients’ businesses. Our aspiration is simple: to be the best services helping our clients to succeed.'
}, {
  icon: 'eye',
  title: 'Our vision',
  body: 'We are a customer-centric digital enterprises.'
}];
function Commitment() {
  return /*#__PURE__*/React.createElement("section", {
    id: "about",
    style: {
      background: 'var(--surface-subtle)',
      padding: 'var(--section-y) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-page)',
      display: 'grid',
      gridTemplateColumns: 'minmax(240px,1fr) minmax(300px,1.4fr)',
      gap: 'var(--space-16)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Meet a"), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--fs-4xl)',
      fontWeight: 'var(--fw-black)',
      letterSpacing: 'var(--ls-wide)',
      textTransform: 'uppercase',
      lineHeight: 'var(--lh-tight)'
    }
  }, "Commitment"), /*#__PURE__*/React.createElement(StatRow, {
    style: {
      marginTop: 'var(--space-10)'
    },
    stats: [{
      value: '20+',
      label: 'Years delivering'
    }, {
      value: 'SE Asia',
      label: 'Coverage'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-8)'
    }
  }, PILLARS.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.title,
    style: {
      display: 'flex',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-page)',
      border: 'var(--border-hairline) solid var(--border-subtle)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 20,
    color: "var(--tbg-blue-900)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-3xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-widest)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-3)',
      fontSize: 'var(--fs-md)',
      lineHeight: 'var(--lh-relaxed)',
      maxWidth: 'var(--measure-prose)'
    }
  }, p.body)))))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/Commitment.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/ContactSection.jsx
try { (() => {
const {
  SectionLabel,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Checkbox,
  Card,
  Icon
} = window.TBGDesignSystem_042a58;
function ContactSection({
  onSent
}) {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("section", {
    id: "contact",
    style: {
      padding: 'var(--section-y) 0',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-page)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
      gap: 'var(--space-16)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Stay in touch"), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--fs-3xl)',
      fontWeight: 'var(--fw-black)',
      letterSpacing: 'var(--ls-wide)',
      textTransform: 'uppercase'
    }
  }, "Contact"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      fontSize: 'var(--fs-sm)'
    }
  }, [['mail', 'cs.thipparath@gmail.com'], ['phone', '+66 2 946 4299'], ['map-pin', '497,499 Ramindra road, Kannayao, Bangkok, THAILAND 10900']].map(([ic, tx]) => /*#__PURE__*/React.createElement("div", {
    key: tx,
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 17,
    color: "var(--tbg-blue-900)",
    style: {
      marginTop: 3
    }
  }), /*#__PURE__*/React.createElement("span", null, tx))))), /*#__PURE__*/React.createElement(Card, {
    variant: "raised",
    accent: "orbit"
  }, sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      minHeight: 260,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle",
    size: 30,
    color: "var(--status-success)"
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--fs-xl)'
    }
  }, "Thank you"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: 'var(--fs-sm)'
    }
  }, "We reply within one business day."), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    onClick: () => setSent(false)
  }, "Send another")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
      if (onSent) onSent();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Name",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Full name",
    required: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Company email",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    placeholder: "you@company.co.th",
    required: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Interested in"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['FleetHubs — Transport & Logistics', 'Cpay — e-payment services', 'IoT & System integration']
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Message"
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 3,
    placeholder: "How can we help?"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Send me product updates"
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    fullWidth: true,
    onClick: () => {}
  }, "Send enquiry")))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/ContactSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/Expertise.jsx
try { (() => {
const {
  Card,
  SectionLabel,
  Icon,
  Logo,
  Button
} = window.TBGDesignSystem_042a58;
const ITEMS = [{
  n: '01',
  icon: 'truck',
  title: 'FleetHubs : Transport & Logistics',
  body: 'Over 20 years experiences, TBG has been helping clients design, develop, and deploy reliable and cost-effective Fleet management and IoT-enabled asset tracking software solution with IoT & Connectivity devices — to create a comprehensive asset tracking solution.',
  extra: 'We also integrate an ERP solution to automate & streamlines operational efficiency and profitability.'
}, {
  n: '02',
  icon: 'credit-card',
  title: 'Cpay : e-payment services',
  body: 'An end-to-end IT services provider, TBG has deep expertise in e-payment services under e-payment licenses in Thailand.',
  extra: 'We experience to develop variously software PLUS integrate with our e-payment platform.',
  mark: 'cpay'
}, {
  n: '03',
  icon: 'cpu',
  title: 'IoT & System integration',
  body: 'With our business partners in Telecommunication, m-health, travel + hospitality that could embedded in various IoT solutions to the clients.'
}];
function Expertise({
  basePath = '../..'
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "product",
    style: {
      padding: 'var(--section-y) 0',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-page)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Our expertise"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
      gap: 'var(--space-6)',
      marginTop: 'var(--space-12)'
    }
  }, ITEMS.map(it => /*#__PURE__*/React.createElement(Card, {
    key: it.n,
    accent: it.mark === 'cpay' ? 'cpay' : 'orbit',
    interactive: true,
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'var(--fw-black)',
      color: 'var(--tbg-blue-900)',
      lineHeight: 1
    }
  }, it.n), /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 26,
    color: "var(--ink-300)",
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 'var(--space-6)',
      fontSize: 'var(--fs-xl)',
      fontWeight: 'var(--fw-bold)'
    }
  }, it.title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--fs-sm)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-muted)'
    }
  }, it.body), it.extra && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-4)',
      fontSize: 'var(--fs-sm)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-muted)'
    }
  }, it.extra), it.mark === 'cpay' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    brand: "cpay",
    height: 54,
    basePath: basePath
  })))))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/Expertise.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/Hero.jsx
try { (() => {
const {
  Button,
  SectionLabel
} = window.TBGDesignSystem_042a58;
function Hero({
  onCta
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--gradient-orbit-deep)',
      opacity: .9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: '-14%',
      top: '-28%',
      width: 820,
      height: 820,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 34% 34%, rgba(160,160,224,.55), rgba(0,0,160,0) 62%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: 'var(--space-32) var(--gutter-page) var(--space-24)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    tone: "inverse",
    rule: false
  }, "Thipparath Business Group Co.,Ltd."), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 'var(--space-6)',
      fontSize: 'clamp(48px,7vw,96px)',
      fontWeight: 'var(--fw-black)',
      letterSpacing: 'var(--ls-wide)',
      lineHeight: 'var(--lh-tight)',
      color: '#fff',
      textTransform: 'uppercase'
    }
  }, "Trusted", /*#__PURE__*/React.createElement("br", null), "in commitment"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-8)',
      maxWidth: '52ch',
      fontSize: 'var(--fs-lg)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'rgba(255,255,255,.78)'
    }
  }, "Thailand based IT business services company, outstanding delivery through South-East Asia."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      marginTop: 'var(--space-10)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: onCta
  }, "Request a demo"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    tone: "ink",
    style: {
      color: '#fff',
      borderColor: 'rgba(255,255,255,.4)'
    }
  }, "Our expertise"))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate-site/Services.jsx
try { (() => {
const {
  SectionLabel
} = window.TBGDesignSystem_042a58;
function Services() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      padding: 'var(--section-y) 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 var(--gutter-page)'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    tone: "inverse"
  }, "Our services"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-8)',
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(21px,2.6vw,32px)',
      fontWeight: 'var(--fw-medium)',
      lineHeight: 'var(--lh-snug)',
      letterSpacing: 'var(--ls-tight)',
      color: '#fff',
      maxWidth: '34ch'
    }
  }, "We help our transport and logistics clients improve operational efficiencies and enhance their customers\u2019 experience through digital insights and information management, automation and other digital enablers."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 'var(--space-6)',
      fontSize: 'var(--fs-lg)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'rgba(255,255,255,.7)',
      maxWidth: '60ch'
    }
  }, "PLUS we add an e-payment services to streamline though out a block chain in many industries : logistics, travel, hospitality, telecommunication, m-health.")));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate-site/Services.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.StatRow = __ds_scope.StatRow;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
