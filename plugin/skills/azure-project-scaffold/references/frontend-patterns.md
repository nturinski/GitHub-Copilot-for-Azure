# Frontend Architecture Patterns

> Same quality bar as backend: typed, tested, structured.

## Core Principle

Frontend consumes shared types package, has own test gate, follows consistent patterns for data fetching, error handling, component structure.

## Rule: Consume Shared Types — No `any`

Every entity, request, response MUST use shared type. No inline `any` or ad-hoc interfaces duplicating shared definitions.

```typescript
// ❌ BAD
const [user, setUser] = useState<any>(null);
const [photos, setPhotos] = useState<any[]>([]);

// ✅ GOOD
import type { PublicUser, Photo } from 'app-shared';
const [user, setUser] = useState<PublicUser | null>(null);
const [photos, setPhotos] = useState<Photo[]>([]);
```

## Rule: API Client Fully Typed

API client MUST use shared request/response types per endpoint. Client = contract boundary.

```typescript
// api/client.ts
import type { AuthResponse, MeResponse, LoginRequest, ListPhotosResponse, PhotoResponse, ErrorResponse } from 'app-shared';

async function request<T>(method: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, { ...options, method, headers });
  if (!res.ok) {
    const err: ErrorResponse = await res.json();
    throw new ApiError(res.status, err.error.code, err.error.message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (data: LoginRequest) => request<AuthResponse>('POST', '/auth/login', { body: JSON.stringify(data) }),
  getMe: () => request<MeResponse>('GET', '/auth/me'),
  listPhotos: (limit = 20, offset = 0) => request<ListPhotosResponse>('GET', `/photos?limit=${limit}&offset=${offset}`),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<PhotoResponse>('POST', '/photos', { body: form });
  },
  deletePhoto: (id: string) => request<{ success: true }>('DELETE', `/photos/${id}`),
};
```

## Rule: Error Handling in Hooks

Every async op MUST catch errors + update error state. Optimistic updates MUST roll back on failure.

```typescript
// ✅ Rollback on failure
const deletePhoto = useCallback(async (id: string) => {
  const previous = photos;
  setPhotos(prev => prev.filter(p => p.id !== id)); // optimistic
  try {
    await api.deletePhoto(id);
  } catch (err) {
    setPhotos(previous); // rollback
    setError(err instanceof Error ? err.message : 'Failed to delete photo');
  }
}, [photos]);
```

### No Silent Error Swallowing

Only ignore expected errors (e.g., 404 for "not found yet"). Surface unexpected ones.

```typescript
// ❌ swallows all errors
api.getCouple().then(setCouple).catch(() => {});

// ✅ ignore only expected 404
api.getCouple().then(setCouple).catch(err => {
  if (err instanceof ApiError && err.status === 404) return;
  setError('Failed to load couple info');
  logger.error('Unexpected error', err);
});
```

## Rule: Confirm Destructive Actions

Permanent delete or irreversible modify MUST require confirmation.

```typescript
<button onClick={() => {
  if (window.confirm('Delete this photo? This cannot be undone.')) {
    onDelete(photo.id);
  }
}}>Delete</button>
```

Prefer custom modal over `window.confirm` for better UX.

## Pattern: Extract Shared Form Components

When 2+ pages share >50% structure, extract a shared component (common with auth forms).

```typescript
interface AuthFormProps {
  title: string;
  fields: { name: string; type: string; label: string; required?: boolean }[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel: string;
  altLink: { text: string; to: string };
}

function AuthForm({ title, fields, onSubmit, submitLabel, altLink }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const data = Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string, string>;
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <div className="form-container">
      <h2>{title}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        {fields.map(f => <input key={f.name} name={f.name} type={f.type} placeholder={f.label} required={f.required} />)}
        <button type="submit" disabled={loading}>{loading ? 'Please wait...' : submitLabel}</button>
      </form>
      <Link to={altLink.to}>{altLink.text}</Link>
    </div>
  );
}
```

## Pattern: File Upload Validation (Client-Side)

Client validates BEFORE sending — immediate feedback + saves bandwidth. **Server MUST also validate** (security).

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `Invalid type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`;
  if (file.size > MAX_FILE_SIZE) return `Too large: ${(file.size/1024/1024).toFixed(1)}MB. Max: 10MB`;
  return null;
}

const handleUpload = async (file: File) => {
  const err = validateFile(file);
  if (err) { setError(err); return; }
  // proceed
};
```

## Pattern: Four-State Data Pages

Every data-fetching page MUST handle all four states:

```typescript
function PhotoGallery() {
  const { photos, loading, error } = usePhotos();

  if (loading) return <div className="loading-skeleton">Loading…</div>;
  if (error) return (
    <div className="error-state">
      <p>Something went wrong: {error}</p>
      <button onClick={retry}>Try again</button>
    </div>
  );
  if (photos.length === 0) return (
    <div className="empty-state">
      <p>No photos yet!</p>
      <Link to="/upload">Upload your first memory</Link>
    </div>
  );
  return <div className="photo-grid">{photos.map(p => <PhotoCard key={p.id} photo={p} />)}</div>;
}
```

## Pattern: Consistent Styling

Pick ONE approach + use consistently. Do NOT mix inline styles with CSS classes.

| Approach | Use When | How |
|----------|----------|-----|
| **CSS Modules** | Component-scoped, medium-large apps | `import styles from './Button.module.css'` |
| **Global CSS + BEM** | Small apps, rapid prototyping | `className="photo-card__caption"` |
| **CSS-in-JS** (styled-components, Emotion) | Dynamic themes, state-based styling | `` const Button = styled.button`…` `` |
| **Tailwind** | Utility-first, design-system projects | `className="flex items-center gap-2"` |

❌ Never mix `style={{ }}` props with CSS classes.

## Frontend Tests

Frontend test gate (Step 11) coverage + setup patterns: see [testing.md](testing.md) → "Frontend Testing" section.
