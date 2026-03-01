const FAVORITES_KEY = 'cineadda:favorites';

export const getFavoriteMovieIds = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
};

const saveFavoriteMovieIds = (ids) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('favorites-updated'));
};

export const isFavoriteMovie = (movieId) => {
  return getFavoriteMovieIds().includes(String(movieId));
};

export const toggleFavoriteMovie = (movieId) => {
  const idStr = String(movieId);
  const currentIds = getFavoriteMovieIds();
  const nextIds = currentIds.includes(idStr)
    ? currentIds.filter((id) => id !== idStr)
    : [...currentIds, idStr];

  saveFavoriteMovieIds(nextIds);
  return nextIds.includes(idStr);
};
