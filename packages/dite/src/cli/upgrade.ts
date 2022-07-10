import { DiteCommand } from '../bin/dite';
import { prepare } from './prepare';

const diteUpgrade: DiteCommand = async (flags) => {
  await prepare();
  console.log(flags);
};

export default diteUpgrade;
