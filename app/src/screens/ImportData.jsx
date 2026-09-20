import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ACADEMIC_YEAR, SEMESTERS, ROLES } from '../data/constants';
import { thaiDate } from '../lib/format';
import { Card, CardLabel, Field, Badge, Notice, Empty } from '../components/Ui';

/**
 * S1 — master data import.
 *
 * The prototype does not parse .xlsx: it validates the file envelope and
 * produces a row report so the confirm-then-commit flow is real, then records
 * the attempt in import_batches. Replacing `inspect()` with a real parser (or
 * the SGS/DMC connector from Wave 2) is the only change needed.
 *
 * Note that the rows themselves are not written from the browser. Master data
 * has no API write policy on purpose — the roster is loaded by a job running as
 * service_role, and this screen records that it happened.
 */
const REQUIRED_SHEETS = ['teachers', 'classrooms', 'students'];

function inspect(file) {
  if (!/\.xlsx$/i.test(file.name)) {
    return { rowsOk: 0, rowsFailed: 0, fatal: 'ไฟล์ต้องเป็นนามสกุล .xlsx เท่านั้น', errors: [] };
  }
  const rows = 240 + (file.size % 160);
  const failed = file.size % 7 === 0 ? 0 : (file.size % 5);
  const errors = Array.from({ length: failed }, (_, i) => ({
    sheet: REQUIRED_SHEETS[i % REQUIRED_SHEETS.length],
    row: 4 + i * 3,
    reason: [
      'รหัสนักเรียนซ้ำกับที่มีอยู่แล้ว',
      'ไม่พบห้องเรียนที่อ้างถึงในทะเบียนภาคเรียนนี้',
      'อีเมลครูไม่ใช่โดเมนของโรงเรียน',
      'ช่องชื่อ-นามสกุลว่าง',
      'ระดับชั้นไม่ตรงกับรูปแบบ ป./ม.',
    ][i % 5],
  }));
  return { rowsOk: rows - failed, rowsFailed: failed, fatal: null, errors };
}

export default function ImportData() {
  const { user, semesterId, importBatches, confirmImport } = useApp();
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [mode, setMode] = useState('append');
  const [year, setYear] = useState(ACADEMIC_YEAR);
  const [term, setTerm] = useState(SEMESTERS.find((s) => s.id === semesterId)?.term ?? 1);
  const [busy, setBusy] = useState(false);

  const allowed = user && ROLES[user.role].canImport;

  function onPick(e) {
    const f = e.target.files[0];
    setFile(f || null);
    setReport(f ? inspect(f) : null);
  }

  async function onConfirm() {
    if (!report || report.fatal) return;
    setBusy(true);
    const ok = await confirmImport({
      fileName: file.name,
      mode,
      rowsOk: report.rowsOk,
      rowsFailed: report.rowsFailed,
      errors: report.errors,
    });
    setBusy(false);
    if (ok) { setFile(null); setReport(null); }
  }

  return (
    <div className="wrap page">
      <div className="page__head">
        <div className="page__titles">
          <span className="eyebrow">FOUNDATION · MASTER DATA</span>
          <h1 className="page__title">นำเข้าข้อมูลหลัก</h1>
          <span className="page__sub">
            อัปโหลด Excel ครู ห้องเรียน และนักเรียน · ตรวจข้อผิดพลาดก่อนยืนยัน (S1)
          </span>
        </div>
      </div>

      {!allowed ? (
        <Notice tone="warn">
          เฉพาะบทบาท <b>ธุรการ</b> เท่านั้นที่นำเข้าข้อมูลหลักได้ · ฐานข้อมูลปฏิเสธการเขียนจากบทบาทอื่น
          ไม่ใช่แค่ซ่อนปุ่ม
        </Notice>
      ) : (
        <div className="cols2">
          <div className="stack stack--lg">
            <Card accent>
              <CardLabel sub="สามชีตในไฟล์เดียว: teachers, classrooms, students">ไฟล์ Excel</CardLabel>

              <div className={`dropzone${file ? ' is-ready' : ''}`}>
                <input id="xlsx" type="file" accept=".xlsx" onChange={onPick} style={{ display: 'none' }} />
                <label htmlFor="xlsx" className="btn btn--outline" style={{ cursor: 'pointer' }}>
                  เลือกไฟล์ .xlsx
                </label>
                <p className="form__note" style={{ marginTop: 12 }}>
                  {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'ยังไม่ได้เลือกไฟล์'}
                </p>
              </div>

              <div className="form__grid" style={{ marginTop: 18 }}>
                <Field label="ปีการศึกษา" required hint="พ.ศ. เช่น 2569">
                  <input className="input" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                </Field>
                <Field label="ภาคเรียน" required>
                  <select className="select" value={term} onChange={(e) => setTerm(e.target.value)}>
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </Field>
                <Field label="โหมดนำเข้า" required hint="แทนที่ทั้งหมดจะลบทะเบียนเดิมของภาคเรียนนี้">
                  <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="append">เพิ่มใหม่</option>
                    <option value="replace">แทนที่ทั้งหมด</option>
                  </select>
                </Field>
              </div>
            </Card>

            {report && (
              <Card>
                <CardLabel sub="ตรวจก่อนยืนยัน · ยังไม่มีการบันทึกลงระบบ">ผลการตรวจ</CardLabel>

                {report.fatal ? (
                  <Notice tone="warn">{report.fatal}</Notice>
                ) : (
                  <>
                    <div className="result">
                      <div className="result__box">
                        <span className="result__value">{report.rowsOk}</span>
                        <span className="result__label">แถวผ่าน</span>
                      </div>
                      <div className="result__box">
                        <span className={`result__value${report.rowsFailed ? ' result__value--bad' : ''}`}>
                          {report.rowsFailed}
                        </span>
                        <span className="result__label">แถวไม่ผ่าน</span>
                      </div>
                      <div className="result__box">
                        <span className="result__value">{REQUIRED_SHEETS.length}</span>
                        <span className="result__label">ชีตที่ต้องมี</span>
                      </div>
                    </div>

                    {report.errors.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        {report.errors.map((e, i) => (
                          <div className="list__row" key={i}>
                            <span className="list__main">
                              <b>{e.sheet} · แถว {e.row}</b>
                              <span>{e.reason}</span>
                            </span>
                            <Badge tone="danger">ไม่ผ่าน</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="form__actions" style={{ marginTop: 18 }}>
                      <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>
                        {busy ? 'กำลังบันทึก…' : `ยืนยันการนำเข้า ${report.rowsOk} แถว`}
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={() => { setFile(null); setReport(null); }}>
                        ยกเลิก
                      </button>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>

          <Card variant="flat">
            <CardLabel sub="เรียงใหม่ไปเก่า">ประวัติการนำเข้า</CardLabel>
            {importBatches.length === 0 ? (
              <Empty>ยังไม่มีประวัติ</Empty>
            ) : importBatches.map((b) => (
              <div className="list__row" key={b.id}>
                <span className="list__main">
                  <b>{b.fileName}</b>
                  <span>
                    {thaiDate(b.uploadedAt)} · {b.mode === 'replace' ? 'แทนที่ทั้งหมด' : 'เพิ่มใหม่'} ·
                    ผ่าน {b.rowsOk} / ไม่ผ่าน {b.rowsFailed}
                  </span>
                </span>
                <Badge tone={b.rowsFailed ? 'warning' : 'success'}>
                  {b.rowsFailed ? 'มีแถวตีกลับ' : 'สำเร็จ'}
                </Badge>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
