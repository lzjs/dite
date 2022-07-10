import { DiteCommand } from '../bin/dite';
import { prepare } from './prepare';

const diteInit: DiteCommand = async (flags) => {
  await prepare();
  console.log(flags);
};

export default diteInit;
