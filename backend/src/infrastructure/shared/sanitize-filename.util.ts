const UNSAFE_FILENAME_REGEX = /["\\/:\*\?<>|\n\r]/g;

export function sanitizeForFilename(value: string): string {
  return value.replace(UNSAFE_FILENAME_REGEX, '_');
}
