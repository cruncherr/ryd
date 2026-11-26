import * as migration_20261112_141416_start from './20261112_141416_start';
import * as migration_20261126_220512_konfigurator from './20261126_220512_konfigurator';

export const migrations = [
  {
    up: migration_20261112_141416_start.up,
    down: migration_20261112_141416_start.down,
    name: '20261112_141416_start',
  },
  {
    up: migration_20261126_220512_konfigurator.up,
    down: migration_20261126_220512_konfigurator.down,
    name: '20261126_220512_konfigurator'
  },
];
