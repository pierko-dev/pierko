import { isPierkoResolver, PierkoResolver } from '../resolver/index.ts';
import { importFolder } from '../utils/index.ts';

export const loadResolvers = async (dir: string): Promise<Array<PierkoResolver>> => {
  const modules = await importFolder(dir);

  return modules.flatMap((module) => Object.values(module).filter(isPierkoResolver));
};
