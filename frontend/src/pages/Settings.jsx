import { useEffect, useState } from 'react';
import api from '../services/api';

const TAB_STORAGE = 'storage';
const TAB_BACKUP = 'backup';
const TAB_QA = 'qa';
const TAB_EMAIL = 'email';

function InfoBox({ children }) {
  return (
    <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-[13px] text-indigo-800 leading-relaxed">
      {children}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</label>
      <input
        className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  );
}

// ─── Storage Settings Tab ───────────────────────────────────────────────────

function StorageTab() {
  const [form, setForm] = useState({ provider: '', region: '', endpoint: '', bucket: '', access_key: '', secret_key: '' });
  const [locked, setLocked] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/storage').then(({ data }) => setForm(data)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await api.put('/settings/storage', form);
      setMsg('Setările au fost salvate.');
      setLocked(true);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post('/settings/storage/test', form);
      setMsg(data.message);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Testul a eșuat.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Setări Storage</h2>

      <InfoBox>
        <p><strong>Pentru Hetzner Object Storage completează:</strong></p>
        <p>Endpoint: ex. https://fsn1.your-objectstorage.com</p>
        <p>Bucket: numele bucket-ului creat</p>
        <p>Access Key și Secret Key: din Hetzner Console (nu email/parolă de cont).</p>
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Provider" value={form.provider} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} placeholder="Hetzner Storage" />
        <Field label="Region" value={form.region} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} placeholder="eu-central" />
        <Field label="Endpoint" value={form.endpoint} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, endpoint: e.target.value }))} placeholder="https://hel1.your-objectstorage.com" />
        <Field label="Bucket" value={form.bucket} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, bucket: e.target.value }))} placeholder="my-bucket" />
        <Field label="Access Key" value={form.access_key} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, access_key: e.target.value }))} placeholder="access key" />
        <Field label="Secret Key" type="password" value={form.secret_key} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, secret_key: e.target.value }))} placeholder="••••••••••••" />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => { setLocked(false); setMsg(''); setErr(''); }}
        >
          Editează setări storage
        </button>
        <button
          type="button"
          disabled={locked || saving}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={save}
        >
          {saving ? 'Se salvează...' : 'Salvează setări storage'}
        </button>
        <button
          type="button"
          disabled={locked || testing}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={testConnection}
        >
          {testing ? 'Se testează...' : 'Testează conexiunea'}
        </button>
      </div>

      {locked && (
        <p className="text-[13px] text-slate-500">
          Câmpurile sunt <strong>blocate</strong>. Apasă „Editează setări storage" pentru a modifica valorile.
        </p>
      )}
    </div>
  );
}

// ─── Scheduler Backup Tab ────────────────────────────────────────────────────

function BackupTab() {
  const [scheduler, setScheduler] = useState({ hour: 3, minute: 0, active: true, server_now: '', next_run_utc: '', last_run: null });
  const [history, setHistory] = useState([]);
  const [savingScheduler, setSavingScheduler] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [schRes, histRes] = await Promise.all([
        api.get('/settings/backup/scheduler'),
        api.get('/settings/backup/history'),
      ]);
      setScheduler(schRes.data);
      setHistory(histRes.data);
    } catch {
      // silent
    }
  };

  useEffect(() => { load(); }, []);

  const saveScheduler = async () => {
    setSavingScheduler(true);
    setMsg('');
    setErr('');
    try {
      await api.put('/settings/backup/scheduler', {
        hour: Number(scheduler.hour),
        minute: Number(scheduler.minute),
        active: scheduler.active,
      });
      setMsg('Scheduler salvat.');
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || 'Eroare la salvare scheduler.');
    } finally {
      setSavingScheduler(false);
    }
  };

  const runNow = async () => {
    setRunningBackup(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post('/settings/backup/run');
      setMsg(data.message);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || 'Backup eșuat.');
    } finally {
      setRunningBackup(false);
    }
  };

  const restore = async (id) => {
    if (!window.confirm('Ești sigur că vrei să restaurezi baza de date din acest backup? Datele curente vor fi suprascrise.')) return;
    setRestoringId(id);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post(`/settings/backup/restore/${id}`);
      setMsg(data.message);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Restore eșuat.');
    } finally {
      setRestoringId(null);
    }
  };

  // Calculate local time from UTC next run
  const nextRunLocal = (() => {
    if (!scheduler.next_run_utc) return '';
    try {
      const parts = scheduler.next_run_utc.match(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/);
      if (!parts) return '';
      const utcDate = new Date(Date.UTC(+parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5]));
      return utcDate.toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Scheduler Backup</h2>

      <InfoBox>
        <p><strong>Cum funcționează:</strong> backup-ul automat pornește în fiecare zi la ora și minutul setate mai jos.</p>
        <p><strong>Exemplu:</strong> ora <strong>5</strong> și minut <strong>0</strong> înseamnă rulare zilnică la <strong>05:00</strong>.</p>
        <p><strong>Important:</strong> ora serverului este UTC.</p>
        {scheduler.server_now && <p><strong>Ora curentă server (UTC):</strong> {scheduler.server_now}</p>}
        {scheduler.next_run_utc && <p><strong>Următoarea rulare estimată (UTC):</strong> {scheduler.next_run_utc}</p>}
        {nextRunLocal && <p><strong>Următoarea rulare estimată (ora ta locală):</strong> {nextRunLocal}</p>}
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Ora backup (0-23)</label>
          <input
            className="h-[40px] w-[80px] rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            type="number" min="0" max="23"
            value={scheduler.hour}
            onChange={(e) => setScheduler((p) => ({ ...p, hour: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Minut (0-59)</label>
          <input
            className="h-[40px] w-[80px] rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            type="number" min="0" max="59"
            value={scheduler.minute}
            onChange={(e) => setScheduler((p) => ({ ...p, minute: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-2 text-[14px] text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
            checked={scheduler.active}
            onChange={(e) => setScheduler((p) => ({ ...p, active: e.target.checked }))}
          />
          Activ (rulează automat la ora setată)
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={savingScheduler}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={saveScheduler}
        >
          {savingScheduler ? 'Se salvează...' : 'Salvează scheduler'}
        </button>
        <button
          type="button"
          disabled={runningBackup}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={runNow}
        >
          {runningBackup ? 'Backup în curs...' : 'Rulează backup acum'}
        </button>
      </div>

      <p className="text-[12px] text-slate-500">
        Butonul „Rulează backup acum" pornește un backup imediat, fără să aștepte ora din scheduler.
      </p>

      {scheduler.last_run && (
        <p className="text-[13px] text-indigo-700">Ultima rulare: {scheduler.last_run}</p>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-[15px] font-semibold text-slate-800 mb-3">Istoric backup</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Start</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Detalii</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.started_at}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${row.status === 'success' ? 'bg-emerald-100 text-emerald-700' : row.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.details}</td>
                    <td className="px-4 py-3 text-right">
                      {row.status === 'success' && (
                        <button
                          type="button"
                          disabled={restoringId === row.id}
                          className="rounded bg-indigo-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          onClick={() => restore(row.id)}
                        >
                          {restoringId === row.id ? '...' : 'Restore'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QA Connector Tab ────────────────────────────────────────────────────────

const BASE_URL = window.location.origin;

function RawKeyModal({ rawKey, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 mb-1">Cheia RAW – copiaz-o acum!</h3>
        <p className="text-[13px] text-amber-600 mb-4">Aceasta este singura dată când cheia este afișată. Nu o poți recupera ulterior.</p>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-800 break-all">
          <span className="flex-1 select-all">{rawKey}</span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded bg-indigo-600 px-3 py-1 text-[12px] font-semibold text-white hover:bg-indigo-700"
          >
            {copied ? 'Copiat!' : 'Copiază'}
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
            Am copiat cheia, închide
          </button>
        </div>
      </div>
    </div>
  );
}

function QaConnectorTab() {
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState({ name: 'qa-platform-default', notes: 'integrare QA extern' });
  const [creating, setCreating] = useState(false);
  const [rotatingId, setRotatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rawKey, setRawKey] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/settings/qa-connector');
      setCredentials(data);
    } catch { /* silent */ }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post('/settings/qa-connector', form);
      setRawKey(data.raw_key);
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Eroare la creare.');
    } finally {
      setCreating(false);
    }
  };

  const rotate = async (id) => {
    setRotatingId(id);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post(`/settings/qa-connector/${id}/rotate`);
      setRawKey(data.raw_key);
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Eroare la rotire.');
    } finally {
      setRotatingId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Ștergi acest credential? Integrările care îl folosesc vor înceta să funcționeze.')) return;
    setDeletingId(id);
    setErr('');
    try {
      await api.delete(`/settings/qa-connector/${id}`);
      setMsg('Credential șters.');
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Eroare la ștergere.');
    } finally {
      setDeletingId(null);
    }
  };

  const hasCredentials = credentials.length > 0;

  return (
    <div className="space-y-5">
      {rawKey && <RawKeyModal rawKey={rawKey} onClose={() => setRawKey(null)} />}

      <div>
        <h2 className="text-lg font-bold text-slate-900">QA Connector</h2>
        <p className="text-[13px] text-slate-500">Gestionezi credentialele pentru platforma QA și copiezi cheia raw pentru integrarea AI.</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${hasCredentials ? 'bg-amber-400' : 'bg-slate-300'}`} />
        <span className="text-[13px] font-medium text-slate-600">
          {hasCredentials ? 'QA Connector configurat (în lucru)' : 'Niciun credential configurat'}
        </span>
      </div>

      <InfoBox>
        <ol className="list-decimal list-inside space-y-1">
          <li>Creezi un credential din formular și copiezi imediat RAW API key (se afișează o singură dată).</li>
          <li>În platforma QA, configurezi header-ul <code className="bg-indigo-100 px-1 rounded">X-QA-API-Key: &lt;RAW_KEY&gt;</code> pentru fiecare request.</li>
          <li>Validezi integrarea cu endpoint-ul <code className="bg-indigo-100 px-1 rounded">/api/qa-connector/health/</code>.</li>
          <li>Consumi datele necesare din <code className="bg-indigo-100 px-1 rounded">/api/qa-connector/spectacole/</code> și <code className="bg-indigo-100 px-1 rounded">/api/qa-connector/scan-jobs/</code>.</li>
          <li>La schimbarea cheii, apeși <strong>Rotește cheia</strong> și actualizezi imediat cheia în platforma QA.</li>
        </ol>
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <form className="flex flex-wrap items-end gap-3" onSubmit={create}>
        <div className="min-w-[220px] flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Nume credential</label>
          <input
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="qa-platform-default"
            required
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Notes</label>
          <input
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="integrare QA extern"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="h-[40px] rounded border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
        >
          {creating ? 'Se creează...' : 'Creează credential'}
        </button>
      </form>

      <div className="space-y-3">
        {credentials.map((cred) => (
          <div key={cred.id} className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{cred.name}</p>
                <p className="text-[12px] text-slate-500">Prefix: {cred.key_prefix}</p>
                <p className="text-[12px] text-slate-500">
                  Ultima utilizare: {cred.last_used_at
                    ? new Date(cred.last_used_at).toLocaleString('ro-RO')
                    : 'niciodată'}
                </p>
                {cred.scope && <p className="text-[12px] text-slate-500">Scope: {cred.scope}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={rotatingId === cred.id}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => rotate(cred.id)}
                >
                  {rotatingId === cred.id ? '...' : 'Rotește cheia'}
                </button>
                <button
                  type="button"
                  disabled={deletingId === cred.id}
                  className="rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                  onClick={() => remove(cred.id)}
                  title="Șterge"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 rounded-b-xl text-[12px] text-slate-600 space-y-0.5">
              <p className="font-semibold text-slate-700 mb-1">Integration info</p>
              <p>Base URL: <span className="text-indigo-700">{BASE_URL}</span></p>
              <p>Header: <code className="bg-slate-200 px-1 rounded">X-QA-API-Key: &lt;RAW_KEY&gt;</code></p>
              <p>Health: <span className="text-indigo-700">{BASE_URL}/api/qa-connector/health/</span></p>
              <p>Spectacole: <span className="text-indigo-700">{BASE_URL}/api/qa-connector/spectacole/?limit=50</span></p>
              <p>Scan jobs: <span className="text-indigo-700">{BASE_URL}/api/qa-connector/scan-jobs/?limit=30</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Email Settings Tab ──────────────────────────────────────────────────────

function EmailSettingsTab() {
  const [form, setForm] = useState({
    name: '',
    mailer: 'SMTP',
    host: '',
    port: 587,
    encryption: 'TLS',
    username: '',
    password: '',
    from_address: '',
    from_name: '',
    monitoring_alert_recipient: '',
    active: true,
  });
  const [locked, setLocked] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/settings/email').then(({ data }) => {
      if (data && data.name) {
        setForm(data);
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await api.put('/settings/email', form);
      setMsg('Setările email au fost salvate.');
      setLocked(true);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    setTesting(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post('/settings/email/test', form);
      setMsg(data.message);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Testul a eșuat.');
    } finally {
      setTesting(false);
    }
  };

  const deleteSettings = async () => {
    if (!window.confirm('Ești sigur că vrei să ștergi setările email? Nu vei mai putea trimite emailuri.')) return;
    setDeleting(true);
    setMsg('');
    setErr('');
    try {
      await api.delete('/settings/email');
      setMsg('Setările email au fost șterse.');
      setForm({
        name: '',
        mailer: 'SMTP',
        host: '',
        port: 587,
        encryption: 'TLS',
        username: '',
        password: '',
        from_address: '',
        from_name: '',
        monitoring_alert_recipient: '',
        active: true,
      });
      setLocked(true);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Eroare la ștergere.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Setări Email</h2>

      <InfoBox>
        <p><strong>Configurează serverul SMTP pentru a trimite emailuri automate</strong> când se înregistrează utilizatori noi.</p>
        <p>Completează datele serverului SMTP din furnizorul tău de email (ex: Gmail, Hetzner, etc.).</p>
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nume" value={form.name} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Domain" />
        
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Mailer</label>
          <select
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            disabled={locked}
            value={form.mailer}
            onChange={(e) => setForm((p) => ({ ...p, mailer: e.target.value }))}
          >
            <option value="SMTP">SMTP</option>
          </select>
        </div>

        <Field label="Host" value={form.host} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))} placeholder="mail.domain.net" />
        
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Port</label>
          <input
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            type="number"
            disabled={locked}
            value={form.port}
            onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
            placeholder="587"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Encryption</label>
          <select
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            disabled={locked}
            value={form.encryption}
            onChange={(e) => setForm((p) => ({ ...p, encryption: e.target.value }))}
          >
            <option value="TLS">TLS</option>
            <option value="SSL">SSL</option>
            <option value="">None</option>
          </select>
        </div>

        <Field label="Username" value={form.username} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="support@domain.net" />
        <Field label="Password" type="password" value={form.password} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••••••" />

        <Field label="From Address" type="email" value={form.from_address} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, from_address: e.target.value }))} placeholder="support@domain.net" />
        <Field label="From Name" value={form.from_name} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, from_name: e.target.value }))} placeholder="Domain Code" />

        <div className="sm:col-span-2">
          <Field label="Monitoring Alert Recipient" type="email" value={form.monitoring_alert_recipient} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, monitoring_alert_recipient: e.target.value }))} placeholder="admin@domain.net" />
          <p className="text-[11px] text-slate-500 mt-1">Email utilizat pentru notificările de înregistrări noi și alerte ale sistemului.</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-[14px] text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          disabled={locked}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 disabled:cursor-not-allowed"
          checked={form.active}
          onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
        />
        Activ (trimitere emailuri activată)
      </label>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => { setLocked(false); setMsg(''); setErr(''); }}
          disabled={!locked}
        >
          Editează setări email
        </button>
        <button
          type="button"
          disabled={locked || saving}
          className="rounded bg-indigo-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={save}
        >
          {saving ? 'Se salvează...' : 'Salvează setări'}
        </button>
        <button
          type="button"
          disabled={locked || testing}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={testEmail}
        >
          {testing ? 'Se testează...' : 'Trimite test email'}
        </button>
        <button
          type="button"
          disabled={locked || deleting}
          className="rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={deleteSettings}
        >
          {deleting ? 'Se șterge...' : 'Șterge'}
        </button>
      </div>

      {locked && (
        <p className="text-[13px] text-slate-500">
          Câmpurile sunt <strong>blocate</strong>. Apasă „Editează setări email" pentru a modifica valorile.
        </p>
      )}
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState(TAB_STORAGE);

  const tabs = [
    { id: TAB_STORAGE, label: 'Setări Storage' },
    { id: TAB_EMAIL, label: 'Setări Email' },
    { id: TAB_BACKUP, label: 'Scheduler Backup' },
    { id: TAB_QA, label: 'QA Connector' },
  ];

  return (
    <div className="settings-page space-y-4">
      <div className="card">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-1 border-b border-slate-200 pb-0 -mb-4 px-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-4 py-2 text-[13px] font-semibold transition border-b-2 -mb-px ${tab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="card">
        {tab === TAB_STORAGE && <StorageTab />}
        {tab === TAB_EMAIL && <EmailSettingsTab />}
        {tab === TAB_BACKUP && <BackupTab />}
        {tab === TAB_QA && <QaConnectorTab />}
      </div>
    </div>
  );
}
