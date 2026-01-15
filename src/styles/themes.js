// Theme definitions for Mission Control
export const themes = {
  'space-program': {
    name: 'space-program',
    label: 'Space Program',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceHover: '#334155',
    primary: '#E8922D',
    secondary: '#38BDF8',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    success: '#10B981',
    warning: '#FBBF24',
    danger: '#F43F5E',
    border: '#334155',
  },
  'control-center': {
    name: 'control-center',
    label: 'Control Center',
    background: '#0D1117',
    surface: '#161B22',
    surfaceHover: '#21262D',
    primary: '#E8922D',
    secondary: '#58A6FF',
    text: '#FFFFFF',
    textSecondary: '#8B949E',
    textMuted: '#6E7681',
    success: '#3FB950',
    warning: '#D29922',
    danger: '#F85149',
    border: '#30363D',
  },
  'light-mode': {
    name: 'light-mode',
    label: 'Light Mode',
    background: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceHover: '#F3F4F6',
    primary: '#E8922D',
    secondary: '#2563EB',
    text: '#24292F',
    textSecondary: '#57606A',
    textMuted: '#8C959F',
    success: '#1A7F37',
    warning: '#BF8700',
    danger: '#CF222E',
    border: '#D0D7DE',
  },
};

export const applyTheme = (themeName) => {
  const theme = themes[themeName] || themes['space-program'];
  const root = document.documentElement;

  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-surface-hover', theme.surfaceHover);
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-warning', theme.warning);
  root.style.setProperty('--color-danger', theme.danger);
  root.style.setProperty('--color-border', theme.border);
};

export const getDateBadgeColor = (dueDate, isComplete, themeName = 'space-program') => {
  const theme = themes[themeName] || themes['space-program'];

  if (isComplete) {
    return theme.success;
  }

  if (!dueDate) {
    return theme.textMuted;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return theme.danger; // Overdue
  } else if (diffDays <= 3) {
    return theme.warning; // Due within 3 days
  } else {
    return theme.secondary; // Future (4+ days)
  }
};
