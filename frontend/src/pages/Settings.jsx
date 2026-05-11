import { useEffect, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { useLocale } from '../i18n/LocaleContext';
import api from '../services/api';
import * as TablerIcons from '@tabler/icons-react';

const TAB_STORAGE = 'storage';
const TAB_BACKUP = 'backup';
const TAB_QA = 'qa';
const TAB_EMAIL = 'email';
const TAB_ICONS = 'icons';

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
  const { locale } = useLocale();
  const ro = locale === 'ro';
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
      setMsg(ro ? 'Setările au fost salvate.' : 'Settings saved.');
      setLocked(true);
    } catch (e) {
      setErr(e?.response?.data?.message || (ro ? 'Eroare la salvare.' : 'Save failed.'));
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
      setErr(e?.response?.data?.message || (ro ? 'Testul a eșuat.' : 'Test failed.'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{ro ? 'Setări Storage' : 'Storage settings'}</h2>

      <InfoBox>
        <p><strong>{ro ? 'Pentru Hetzner Object Storage completează:' : 'For Hetzner Object Storage fill in:'}</strong></p>
        <p>{ro ? 'Endpoint:' : 'Endpoint:'} {ro ? 'de ex. https://fsn1.your-objectstorage.com' : 'e.g. https://fsn1.your-objectstorage.com'}</p>
        <p>{ro ? 'Bucket:' : 'Bucket:'} {ro ? 'numele bucket-ului creat' : 'the bucket name you created'}</p>
        <p>{ro ? 'Access Key și Secret Key:' : 'Access Key and Secret Key:'} {ro ? 'din Hetzner Console (nu email/parolă de cont).' : 'from Hetzner Console (not account email/password).'}</p>
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={ro ? 'Provider' : 'Provider'} value={form.provider} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} placeholder={ro ? 'Hetzner Storage' : 'Hetzner Storage'} />
        <Field label={ro ? 'Regiune' : 'Region'} value={form.region} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} placeholder="eu-central" />
        <Field label={ro ? 'Endpoint' : 'Endpoint'} value={form.endpoint} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, endpoint: e.target.value }))} placeholder="https://hel1.your-objectstorage.com" />
        <Field label={ro ? 'Bucket' : 'Bucket'} value={form.bucket} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, bucket: e.target.value }))} placeholder="my-bucket" />
        <Field label={ro ? 'Access Key' : 'Access Key'} value={form.access_key} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, access_key: e.target.value }))} placeholder={ro ? 'cheia de acces' : 'access key'} />
        <Field label={ro ? 'Secret Key' : 'Secret Key'} type="password" value={form.secret_key} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, secret_key: e.target.value }))} placeholder="••••••••••••" />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => { setLocked(false); setMsg(''); setErr(''); }}
        >
          {ro ? 'Editează setări storage' : 'Edit storage settings'}
        </button>
        <button
          type="button"
          disabled={locked || saving}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={save}
        >
          {saving ? (ro ? 'Se salvează...' : 'Saving...') : (ro ? 'Salvează setări storage' : 'Save storage settings')}
        </button>
        <button
          type="button"
          disabled={locked || testing}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={testConnection}
        >
          {testing ? (ro ? 'Se testează...' : 'Testing...') : (ro ? 'Testează conexiunea' : 'Test connection')}
        </button>
      </div>

      {locked && (
        <p className="text-[13px] text-slate-500">
          {ro ? 'Câmpurile sunt' : 'Fields are'} <strong>{ro ? 'blocate' : 'locked'}</strong>. {ro ? 'Apasă „Editează setări storage" pentru a modifica valorile.' : 'Click "Edit storage settings" to change the values.'}
        </p>
      )}
    </div>
  );
}

// ─── Scheduler Backup Tab ────────────────────────────────────────────────────

function BackupTab() {
  const { locale } = useLocale();
  const ro = locale === 'ro';
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
      setMsg(ro ? 'Scheduler salvat.' : 'Scheduler saved.');
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || (ro ? 'Eroare la salvare scheduler.' : 'Could not save scheduler.'));
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
      setErr(e?.response?.data?.message || (ro ? 'Backup eșuat.' : 'Backup failed.'));
    } finally {
      setRunningBackup(false);
    }
  };

  const restore = async (id) => {
    if (!window.confirm(ro ? 'Ești sigur că vrei să restaurezi baza de date din acest backup? Datele curente vor fi suprascrise.' : 'Are you sure you want to restore the database from this backup? Current data will be overwritten.')) return;
    setRestoringId(id);
    setMsg('');
    setErr('');
    try {
      const { data } = await api.post(`/settings/backup/restore/${id}`);
      setMsg(data.message);
    } catch (e) {
      setErr(e?.response?.data?.message || (ro ? 'Restore eșuat.' : 'Restore failed.'));
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
      <h2 className="text-lg font-bold text-slate-900">{ro ? 'Scheduler backup' : 'Backup scheduler'}</h2>

      <InfoBox>
        <p><strong>{ro ? 'Cum funcționează:' : 'How it works:'}</strong> {ro ? 'backup-ul automat pornește în fiecare zi la ora și minutul setate mai jos.' : 'the automatic backup runs every day at the hour and minute configured below.'}</p>
        <p><strong>{ro ? 'Exemplu:' : 'Example:'}</strong> {ro ? 'ora' : 'hour'} <strong>5</strong> {ro ? 'și minut' : 'and minute'} <strong>0</strong> {ro ? 'înseamnă rulare zilnică la' : 'means a daily run at'} <strong>05:00</strong>.</p>
        <p><strong>{ro ? 'Important:' : 'Important:'}</strong> {ro ? 'ora serverului este UTC.' : 'server time is UTC.'}</p>
        {scheduler.server_now && <p><strong>{ro ? 'Ora curentă server (UTC):' : 'Current server time (UTC):'}</strong> {scheduler.server_now}</p>}
        {scheduler.next_run_utc && <p><strong>{ro ? 'Următoarea rulare estimată (UTC):' : 'Next estimated run (UTC):'}</strong> {scheduler.next_run_utc}</p>}
        {nextRunLocal && <p><strong>{ro ? 'Următoarea rulare estimată (ora ta locală):' : 'Next estimated run (your local time):'}</strong> {nextRunLocal}</p>}
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{ro ? 'Ora backup (0-23)' : 'Backup hour (0-23)'}</label>
          <input
            className="h-[40px] w-[80px] rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            type="number" min="0" max="23"
            value={scheduler.hour}
            onChange={(e) => setScheduler((p) => ({ ...p, hour: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{ro ? 'Minut (0-59)' : 'Minute (0-59)'}</label>
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
          {ro ? 'Activ (rulează automat la ora setată)' : 'Active (runs automatically at the configured time)'}
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={savingScheduler}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={saveScheduler}
        >
          {savingScheduler ? (ro ? 'Se salvează...' : 'Saving...') : (ro ? 'Salvează scheduler' : 'Save scheduler')}
        </button>
        <button
          type="button"
          disabled={runningBackup}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={runNow}
        >
          {runningBackup ? (ro ? 'Backup în curs...' : 'Backup in progress...') : (ro ? 'Rulează backup acum' : 'Run backup now')}
        </button>
      </div>

      <p className="text-[12px] text-slate-500">
        {ro ? 'Butonul „Rulează backup acum" pornește un backup imediat, fără să aștepte ora din scheduler.' : 'The "Run backup now" button starts an immediate backup without waiting for the scheduler time.'}
      </p>

      {scheduler.last_run && (
        <p className="text-[13px] text-indigo-700">{ro ? 'Ultima rulare:' : 'Last run:'} {scheduler.last_run}</p>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-[15px] font-semibold text-slate-800 mb-3">{ro ? 'Istoric backup' : 'Backup history'}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{ro ? 'Start' : 'Started'}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">{ro ? 'Detalii' : 'Details'}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">{ro ? 'Acțiuni' : 'Actions'}</th>
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
                          {restoringId === row.id ? '...' : (ro ? 'Restaurează' : 'Restore')}
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
  const { locale } = useLocale();
  const ro = locale === 'ro';
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState({ name: 'qa-platform-default', notes: locale === 'ro' ? 'integrare QA extern' : 'external QA integration' });
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
      setErr(ex?.response?.data?.message || (ro ? 'Eroare la creare.' : 'Could not create credential.'));
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
      setErr(ex?.response?.data?.message || (ro ? 'Eroare la rotire.' : 'Could not rotate key.'));
    } finally {
      setRotatingId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(ro ? 'Ștergi acest credential? Integrările care îl folosesc vor înceta să funcționeze.' : 'Delete this credential? Integrations using it will stop working.')) return;
    setDeletingId(id);
    setErr('');
    try {
      await api.delete(`/settings/qa-connector/${id}`);
      setMsg(ro ? 'Credential șters.' : 'Credential deleted.');
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.message || (ro ? 'Eroare la ștergere.' : 'Could not delete credential.'));
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
        <p className="text-[13px] text-slate-500">{ro ? 'Gestionezi credentialele pentru platforma QA și copiezi cheia raw pentru integrarea AI.' : 'Manage QA platform credentials and copy the raw key for AI integration.'}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${hasCredentials ? 'bg-amber-400' : 'bg-slate-300'}`} />
        <span className="text-[13px] font-medium text-slate-600">
          {hasCredentials ? (ro ? 'QA Connector configurat (în lucru)' : 'QA Connector configured (in progress)') : (ro ? 'Niciun credential configurat' : 'No credentials configured')}
        </span>
      </div>

      <InfoBox>
        <ol className="list-decimal list-inside space-y-1">
          <li>{ro ? 'Creezi un credential din formular și copiezi imediat RAW API key (se afișează o singură dată).' : 'Create a credential from the form and copy the RAW API key immediately (it is shown only once).'}</li>
          <li>{ro ? 'În platforma QA, configurezi header-ul' : 'In the QA platform, configure the header'} <code className="bg-indigo-100 px-1 rounded">X-QA-API-Key: &lt;RAW_KEY&gt;</code> {ro ? 'pentru fiecare request.' : 'for each request.'}</li>
          <li>{ro ? 'Validezi integrarea cu endpoint-ul' : 'Validate the integration with the endpoint'} <code className="bg-indigo-100 px-1 rounded">/api/qa-connector/health/</code>.</li>
          <li>{ro ? 'Consumi datele necesare din' : 'Consume the required data from'} <code className="bg-indigo-100 px-1 rounded">/api/qa-connector/spectacole/</code> {ro ? 'și' : 'and'} <code className="bg-indigo-100 px-1 rounded">/api/qa-connector/scan-jobs/</code>.</li>
          <li>{ro ? 'La schimbarea cheii, apeși' : 'When changing the key, click'} <strong>{ro ? 'Rotește cheia' : 'Rotate key'}</strong> {ro ? 'și actualizezi imediat cheia în platforma QA.' : 'and update the key immediately in the QA platform.'}</li>
        </ol>
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <form className="flex flex-wrap items-end gap-3" onSubmit={create}>
        <div className="min-w-[220px] flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{ro ? 'Nume credential' : 'Credential name'}</label>
          <input
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="qa-platform-default"
            required
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{ro ? 'Note' : 'Notes'}</label>
          <input
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder={ro ? 'integrare QA extern' : 'external QA integration'}
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="h-[40px] rounded border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
        >
          {creating ? (ro ? 'Se creează...' : 'Creating...') : (ro ? 'Creează credential' : 'Create credential')}
        </button>
      </form>

      <div className="space-y-3">
        {credentials.map((cred) => (
          <div key={cred.id} className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{cred.name}</p>
                <p className="text-[12px] text-slate-500">{ro ? 'Prefix:' : 'Prefix:'} {cred.key_prefix}</p>
                <p className="text-[12px] text-slate-500">
                  {ro ? 'Ultima utilizare:' : 'Last used:'} {cred.last_used_at
                    ? new Date(cred.last_used_at).toLocaleString(ro ? 'ro-RO' : 'en-US')
                    : (ro ? 'niciodată' : 'never')}
                </p>
                {cred.scope && <p className="text-[12px] text-slate-500">{ro ? 'Scope:' : 'Scope:'} {cred.scope}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={rotatingId === cred.id}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => rotate(cred.id)}
                >
                  {rotatingId === cred.id ? '...' : (ro ? 'Rotește cheia' : 'Rotate key')}
                </button>
                <button
                  type="button"
                  disabled={deletingId === cred.id}
                  className="rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                  onClick={() => remove(cred.id)}
                  title={ro ? 'Șterge' : 'Delete'}
                >
                  <IconX size={14} stroke={2.2} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 rounded-b-xl text-[12px] text-slate-600 space-y-0.5">
              <p className="font-semibold text-slate-700 mb-1">{ro ? 'Informații integrare' : 'Integration info'}</p>
              <p>{ro ? 'URL de bază:' : 'Base URL:'} <span className="text-indigo-700">{BASE_URL}</span></p>
              <p>Header: <code className="bg-slate-200 px-1 rounded">X-QA-API-Key: &lt;RAW_KEY&gt;</code></p>
              <p>{ro ? 'Health:' : 'Health:'} <span className="text-indigo-700">{BASE_URL}/api/qa-connector/health/</span></p>
              <p>{ro ? 'Spectacole:' : 'Shows:'} <span className="text-indigo-700">{BASE_URL}/api/qa-connector/spectacole/?limit=50</span></p>
              <p>{ro ? 'Scan jobs:' : 'Scan jobs:'} <span className="text-indigo-700">{BASE_URL}/api/qa-connector/scan-jobs/?limit=30</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Email Settings Tab ──────────────────────────────────────────────────────

function EmailSettingsTab() {
  const { locale } = useLocale();
  const ro = locale === 'ro';
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
      setMsg(ro ? 'Setările email au fost salvate.' : 'Email settings saved.');
      setLocked(true);
    } catch (e) {
      setErr(e?.response?.data?.message || (ro ? 'Eroare la salvare.' : 'Save failed.'));
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
      setErr(e?.response?.data?.message || (ro ? 'Testul a eșuat.' : 'Test failed.'));
    } finally {
      setTesting(false);
    }
  };

  const deleteSettings = async () => {
    if (!window.confirm(ro ? 'Ești sigur că vrei să ștergi setările email? Nu vei mai putea trimite emailuri.' : 'Are you sure you want to delete the email settings? You will no longer be able to send emails.')) return;
    setDeleting(true);
    setMsg('');
    setErr('');
    try {
      await api.delete('/settings/email');
      setMsg(ro ? 'Setările email au fost șterse.' : 'Email settings deleted.');
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
      setErr(e?.response?.data?.message || (ro ? 'Eroare la ștergere.' : 'Delete failed.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">{ro ? 'Setări Email' : 'Email settings'}</h2>

      <InfoBox>
        <p><strong>{ro ? 'Configurează serverul SMTP pentru a trimite emailuri automate' : 'Configure the SMTP server to send automatic emails'}</strong> {ro ? 'când se înregistrează utilizatori noi.' : 'when new users register.'}</p>
        <p>{ro ? 'Completează datele serverului SMTP din furnizorul tău de email (ex: Gmail, Hetzner, etc.).' : 'Fill in the SMTP server details from your email provider (e.g. Gmail, Hetzner, etc.).'}</p>
      </InfoBox>

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={ro ? 'Nume' : 'Name'} value={form.name} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Domain" />
        
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
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{ro ? 'Criptare' : 'Encryption'}</label>
          <select
            className="h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            disabled={locked}
            value={form.encryption}
            onChange={(e) => setForm((p) => ({ ...p, encryption: e.target.value }))}
          >
            <option value="TLS">TLS</option>
            <option value="SSL">SSL</option>
            <option value="">{ro ? 'Niciuna' : 'None'}</option>
          </select>
        </div>

        <Field label={ro ? 'Nume utilizator' : 'Username'} value={form.username} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="support@domain.net" />
        <Field label={ro ? 'Parolă' : 'Password'} type="password" value={form.password} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••••••" />

        <Field label={ro ? 'Adresa expeditor' : 'From address'} type="email" value={form.from_address} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, from_address: e.target.value }))} placeholder="support@domain.net" />
        <Field label={ro ? 'Nume expeditor' : 'From name'} value={form.from_name} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, from_name: e.target.value }))} placeholder="Domain Code" />

        <div className="sm:col-span-2">
          <Field label={ro ? 'Destinatar alerte monitorizare' : 'Monitoring alert recipient'} type="email" value={form.monitoring_alert_recipient} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, monitoring_alert_recipient: e.target.value }))} placeholder="admin@domain.net" />
          <p className="text-[11px] text-slate-500 mt-1">{ro ? 'Email utilizat pentru notificările de înregistrări noi și alerte ale sistemului.' : 'Email used for new registration notifications and system alerts.'}</p>
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
        {ro ? 'Activ (trimitere emailuri activată)' : 'Active (email sending enabled)'}
      </label>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => { setLocked(false); setMsg(''); setErr(''); }}
          disabled={!locked}
        >
          {ro ? 'Editează setări email' : 'Edit email settings'}
        </button>
        <button
          type="button"
          disabled={locked || saving}
          className="rounded bg-indigo-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={save}
        >
          {saving ? (ro ? 'Se salvează...' : 'Saving...') : (ro ? 'Salvează setări' : 'Save settings')}
        </button>
        <button
          type="button"
          disabled={locked || testing}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={testEmail}
        >
          {testing ? (ro ? 'Se testează...' : 'Testing...') : (ro ? 'Trimite test email' : 'Send test email')}
        </button>
        <button
          type="button"
          disabled={locked || deleting}
          className="rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={deleteSettings}
        >
          {deleting ? (ro ? 'Se șterge...' : 'Deleting...') : (ro ? 'Șterge' : 'Delete')}
        </button>
      </div>

      {locked && (
        <p className="text-[13px] text-slate-500">
          {ro ? 'Câmpurile sunt' : 'Fields are'} <strong>{ro ? 'blocate' : 'locked'}</strong>. {ro ? 'Apasă „Editează setări email" pentru a modifica valorile.' : 'Click "Edit email settings" to modify the values.'}
        </p>
      )}
    </div>
  );
}

function IconsTab() {
  const allIcons = Object.entries(TablerIcons)
    .filter(([name]) => name.startsWith('Icon'))
    .sort(([left], [right]) => left.localeCompare(right));

  const ICONS_PER_BATCH = 30;
  const [visibleCount, setVisibleCount] = useState(ICONS_PER_BATCH);

  useEffect(() => {
    setVisibleCount(ICONS_PER_BATCH);
  }, [allIcons.length]);

  const visibleIcons = allIcons.slice(0, visibleCount);
  const hasMore = visibleCount < allIcons.length;

  const onIconsScroll = (event) => {
    if (!hasMore) return;

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 120;

    if (nearBottom) {
      setVisibleCount((prev) => Math.min(prev + ICONS_PER_BATCH, allIcons.length));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{ro ? 'Iconițe Tabler' : 'Tabler Icons'}</h2>
        <p className="text-[13px] text-slate-500">{locale === 'ro' ? 'Toate iconițele disponibile din pachetul @tabler/icons-react.' : 'All icons available in the @tabler/icons-react package.'}</p>
      </div>

      <div className="max-h-[62vh] overflow-y-auto pr-1" onScroll={onIconsScroll}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visibleIcons.map(([name, Icon]) => {
            const IconComponent = Icon;
            return (
              <div key={name} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex h-10 items-center justify-center text-slate-700">
                  <IconComponent size={22} stroke={1.8} />
                </div>
                <p className="truncate text-center text-[11px] font-medium text-slate-600" title={name}>
                  {name}
                </p>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <p className="py-3 text-center text-[12px] text-slate-500">
            {locale === 'ro' ? 'Scroll pentru mai multe iconițe...' : 'Scroll for more icons...'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { locale } = useLocale();
  const ro = locale === 'ro';
  const [tab, setTab] = useState(TAB_STORAGE);

  const tabs = [
    { id: TAB_STORAGE, label: ro ? 'Setări Storage' : 'Storage settings' },
    { id: TAB_EMAIL, label: ro ? 'Setări Email' : 'Email settings' },
    { id: TAB_BACKUP, label: ro ? 'Scheduler Backup' : 'Backup scheduler' },
    { id: TAB_QA, label: ro ? 'QA Connector' : 'QA Connector' },
    { id: TAB_ICONS, label: ro ? 'Iconițe' : 'Icons' },
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
        {tab === TAB_ICONS && <IconsTab />}
      </div>
    </div>
  );
}
