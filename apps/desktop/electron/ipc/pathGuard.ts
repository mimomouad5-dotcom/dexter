// Component: n10 IPC Gateway (تحقق المسارات Path Guard)
import path from 'path';

export interface PathValidationResult {
  valid: boolean;
  sanitizedPath?: string;
  error?: string;
}

const FORBIDDEN_CHARS = /[<>:"|?*]/;

export function validateSafePath(filePath: string, allowedRoots: string[] = []): PathValidationResult {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'File path must be a non-empty string' };
  }

  const trimmed = filePath.trim();

  // Check for directory traversal sequences '..' in raw input
  const rawParts = trimmed.split(/[/\\]/);
  if (rawParts.includes('..') || trimmed.includes('../') || trimmed.includes('..\\')) {
    return { valid: false, error: 'Path traversal (..) sequence detected and rejected' };
  }

  // Normalize path
  const normalized = path.normalize(trimmed);

  // Check forbidden Windows/POSIX special characters (excluding drive letter colon)
  const pathWithoutDrive = normalized.replace(/^[a-zA-Z]:[/\\]/, '');
  if (FORBIDDEN_CHARS.test(pathWithoutDrive)) {
    return { valid: false, error: 'Path contains illegal special characters' };
  }

  // Reject UNC paths unless explicitly permitted
  if (normalized.startsWith('\\\\') || normalized.startsWith('//')) {
    return { valid: false, error: 'Remote UNC paths are prohibited' };
  }

  // If allowed roots are specified, ensure the path resides inside one of them
  if (allowedRoots.length > 0) {
    const isWithinRoot = allowedRoots.some((root) => {
      const normalizedRoot = path.normalize(root);
      return normalized.startsWith(normalizedRoot);
    });

    if (!isWithinRoot) {
      return { valid: false, error: 'Path is outside registered allowed root directories' };
    }
  }

  return {
    valid: true,
    sanitizedPath: normalized,
  };
}
