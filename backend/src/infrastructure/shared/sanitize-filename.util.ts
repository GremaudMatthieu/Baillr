const UNSAFE_FILENAME_REGEX = /["\\/:\*\?<>|\n\r\s]/g;

export function sanitizeForFilename(value: string): string {
  return value.replace(UNSAFE_FILENAME_REGEX, '_');
}
