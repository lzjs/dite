import consola from 'consola';
import fs from 'fs';

export function printAndExit(message: string, code = 1) {
  if (code === 0) {
    consola.log(message);
  } else {
    consola.error(message);
  }
  process.exit(code);
}

export async function read(dir: string, name: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(
      `${dir}/${name}`,
      (error: NodeJS.ErrnoException | null, data: Buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.toString());
        }
      },
    );
  });
}

export async function readAnyOf(
  dir: string,
  filenames: string[],
): Promise<string | undefined> {
  try {
    for (const file of filenames) {
      return await read(dir, file);
    }
  } catch (err) {
    return filenames.length > 0
      ? await readAnyOf(dir, filenames.slice(1, filenames.length))
      : undefined;
  }
}
