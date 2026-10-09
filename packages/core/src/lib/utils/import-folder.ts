import { pathToFileURL } from 'node:url';

import fg from 'fast-glob';

export const importFolder = async (dir: string, ignore: Array<string> = []) => {
  const files = await fg('**/*.{ts,js}', { cwd: dir, absolute: true, ignore });

  return Promise.all(files.map((file) => import(pathToFileURL(file).href)));
};
