import * as migration_20261112_141416_start from './20261112_141416_start';
import * as migration_20261126_220512_konfigurator from './20261126_220512_konfigurator';
import * as migration_20261126_235533_toptextil from './20261126_235533_toptextil';
import * as migration_20261128_041758_edycje from './20261128_041758_edycje';

export const migrations = [
  {
    up: migration_20261112_141416_start.up,
    down: migration_20261112_141416_start.down,
    name: '20261112_141416_start',
  },
  {
    up: migration_20261126_220512_konfigurator.up,
    down: migration_20261126_220512_konfigurator.down,
    name: '20261126_220512_konfigurator',
  },
  {
    up: migration_20261126_235533_toptextil.up,
    down: migration_20261126_235533_toptextil.down,
    name: '20261126_235533_toptextil',
  },
  {
    up: migration_20261128_041758_edycje.up,
    down: migration_20261128_041758_edycje.down,
    name: '20261128_041758_edycje'
  },
];
