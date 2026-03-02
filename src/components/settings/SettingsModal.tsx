import { useState } from 'react';
import type { GitHubConfig } from '@/lib/github';
import { testConnection } from '@/lib/github';
import { saveConfig } from '@/lib/githubConfig';
import { getAllNotes } from '@/lib/storage';
import { createNote } from '@/lib/githubStorage';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SettingsModalProps {
  currentConfig: GitHubConfig | null;
  onClose?: () => void; // undefined = first-run, cannot dismiss
  onSave: (cfg: GitHubConfig) => void;
}

export function SettingsModal({ currentConfig, onClose, onSave }: SettingsModalProps) {
  const [pat, setPat] = useState(currentConfig?.pat ?? '');
  const [owner, setOwner] = useState(currentConfig?.owner ?? '');
  const [repo, setRepo] = useState(currentConfig?.repo ?? '');
  const [branch, setBranch] = useState(currentConfig?.branch ?? 'main');

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [migrateStatus, setMigrateStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [migrateMessage, setMigrateMessage] = useState('');
  const [migrateProgress, setMigrateProgress] = useState('');

  const localNotes = getAllNotes();

  function buildConfig(): GitHubConfig {
    return { pat: pat.trim(), owner: owner.trim(), repo: repo.trim(), branch: branch.trim() || 'main' };
  }

  async function handleTest() {
    setTestStatus('testing');
    setTestMessage('');
    const err = await testConnection(buildConfig());
    if (err) {
      setTestStatus('error');
      setTestMessage(err);
    } else {
      setTestStatus('ok');
      setTestMessage('Connected successfully!');
    }
  }

  function handleSave() {
    const cfg = buildConfig();
    saveConfig(cfg);
    onSave(cfg);
  }

  async function handleMigrate() {
    setMigrateStatus('running');
    setMigrateMessage('');
    const cfg = buildConfig();
    const notes = getAllNotes();
    let done = 0;
    try {
      for (const note of notes) {
        setMigrateProgress(`Uploading note ${done + 1} of ${notes.length}…`);
        // eslint-disable-next-line no-await-in-loop
        await createNote(cfg, {
          date: note.date,
          noteText: note.noteText,
          plantName: note.plantName,
          gardenLocation: note.gardenLocation,
          photos: note.photos,
        });
        done++;
      }
      localStorage.removeItem('garden_planner_notes');
      setMigrateStatus('done');
      setMigrateMessage(`Migrated ${done} note${done !== 1 ? 's' : ''} successfully. Local data cleared.`);
      setMigrateProgress('');
    } catch (err) {
      setMigrateStatus('error');
      setMigrateMessage(err instanceof Error ? err.message : String(err));
      setMigrateProgress('');
    }
  }

  const isValid = pat.trim() && owner.trim() && repo.trim();

  return (
    <Modal title="GitHub Settings" onClose={onClose} wide>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-gray-600">
          Garden notes are stored in a private GitHub repository. Enter your Personal Access Token
          and data repository details below.
        </p>

        {/* PAT */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="s-pat">
            Personal Access Token (PAT)
          </label>
          <input
            id="s-pat"
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="github_pat_…"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>

        {/* Owner */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="s-owner">
            GitHub Username / Org
          </label>
          <input
            id="s-owner"
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="your-github-username"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>

        {/* Repo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="s-repo">
            Data Repository Name
          </label>
          <input
            id="s-repo"
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="garden-data"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>

        {/* Branch */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="s-branch">
            Branch
          </label>
          <input
            id="s-branch"
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-garden-500"
          />
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            disabled={!isValid || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? 'Testing…' : 'Test Connection'}
          </Button>
          {testStatus === 'ok' && (
            <span className="text-sm text-green-600 font-medium">{testMessage}</span>
          )}
          {testStatus === 'error' && (
            <span className="text-sm text-red-600">{testMessage}</span>
          )}
        </div>

        {/* Migrate from localStorage */}
        {localNotes.length > 0 && (
          <div className="border border-earth-200 rounded-lg p-4 bg-earth-50 flex flex-col gap-2">
            <p className="text-sm font-medium text-earth-800">
              Migrate {localNotes.length} local note{localNotes.length !== 1 ? 's' : ''} to GitHub
            </p>
            <p className="text-xs text-earth-600">
              This will upload all locally stored notes and photos to your GitHub data repository,
              then clear the local storage.
            </p>
            {migrateProgress && (
              <p className="text-xs text-earth-700 font-medium">{migrateProgress}</p>
            )}
            {migrateStatus === 'done' && (
              <p className="text-xs text-green-700 font-medium">{migrateMessage}</p>
            )}
            {migrateStatus === 'error' && (
              <p className="text-xs text-red-600">{migrateMessage}</p>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMigrate}
              disabled={!isValid || migrateStatus === 'running' || migrateStatus === 'done'}
            >
              {migrateStatus === 'running' ? 'Migrating…' : `Migrate ${localNotes.length} Note${localNotes.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isValid}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
}
