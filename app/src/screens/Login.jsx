import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Card, Field, Notice } from '../components/Ui';

/** S0 — sign in with the school email. Everything the app then shows is decided by RLS. */
export default function Login() {
  const { signIn, isConfigured } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <div className="login">
      <span className="login__glow" aria-hidden="true" />

      <div className="login__panel">
        <span className="nav__mark" style={{ color: 'var(--ink-000)' }}>TBG SCHOOL OS</span>
        <h1 className="login__title">School at a glance</h1>
        <p className="login__sub">
          เข้าสู่ระบบด้วยอีเมลโรงเรียน · สิ่งที่คุณเห็นขึ้นกับบทบาทของคุณ
        </p>
      </div>

      <Card className="login__card">
        <form className="form" onSubmit={submit} style={{ maxWidth: 'none' }}>
          {!isConfigured && (
            <Notice tone="warn">
              ยังไม่ได้ตั้งค่า <b>.env</b> · คัดลอก <code>.env.example</code> เป็น <code>.env</code>{' '}
              แล้วใส่ <code>VITE_SUPABASE_URL</code> กับ <code>VITE_SUPABASE_ANON_KEY</code>
            </Notice>
          )}

          <Field label="อีเมลโรงเรียน" required>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="director@tbg.ac.th"
              required
              disabled={!isConfigured}
            />
          </Field>

          <Field label="รหัสผ่าน" required>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!isConfigured}
            />
          </Field>

          {error && <Notice tone="warn">{error}</Notice>}

          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={busy || !isConfigured}>
              {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
            </button>
          </div>

          <p className="form__note">
            บัญชีสร้างโดยผู้ดูแลระบบใน Supabase และผูกกับทะเบียนครูด้วยอีเมลโดยอัตโนมัติ ·
            ถ้าอีเมลไม่ตรงกับทะเบียน ระบบจะเข้าได้แต่จะไม่เห็นข้อมูลใด ๆ
          </p>
        </form>
      </Card>
    </div>
  );
}
