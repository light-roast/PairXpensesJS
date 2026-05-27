const HOME_CACHE_KEY = 'homeState';
const HOME_CACHE_VERSION = 1;

export function saveHomeCache(snapshot) {
    try {
        sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify({
            v: HOME_CACHE_VERSION,
            savedAt: Date.now(),
            ...snapshot
        }));
    } catch (_) {
        // quota / disabled storage — silently skip; revalidation still works
    }
}

export function loadHomeCache() {
    try {
        const raw = sessionStorage.getItem(HOME_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.v !== HOME_CACHE_VERSION) return null;
        if (!parsed.users || !parsed.userA || !parsed.userB) return null;
        return parsed;
    } catch (_) {
        return null;
    }
}

export function clearHomeCache() {
    sessionStorage.removeItem(HOME_CACHE_KEY);
}
