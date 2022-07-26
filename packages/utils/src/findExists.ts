import fse from '../compiled/fs-extra';

/**
 * Find first already exists file.
 * @param files - Absolute file paths with extension.
 * @returns The file path if exists, or false if no file exists.
 */
export const findExists = (files: string[]): string | false => {
  for (const file of files) {
    if (fse.existsSync(file) && fse.statSync(file).isFile()) {
      return file;
    }
  }
  return false;
};
