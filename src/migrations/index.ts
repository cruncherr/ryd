import * as migration_20261112_141416_start from './20261112_141416_start';

export const migrations = [
  {
    up: migration_20261112_141416_start.up,
    down: migration_20261112_141416_start.down,
    name: '20261112_141416_start'
  },
];
