import * as migration_20260528_233905_initial from './20260528_233905_initial';
import * as migration_20261004_112256_site_publish_reservations from './20261004_112256_site_publish_reservations';
import * as migration_20261008_114148_payload_3_90 from './20261008_114148_payload_3_90';

export const migrations = [
  {
    up: migration_20260528_233905_initial.up,
    down: migration_20260528_233905_initial.down,
    name: '20260528_233905_initial',
  },
  {
    up: migration_20261004_112256_site_publish_reservations.up,
    down: migration_20261004_112256_site_publish_reservations.down,
    name: '20261004_112256_site_publish_reservations',
  },
  {
    up: migration_20261008_114148_payload_3_90.up,
    down: migration_20261008_114148_payload_3_90.down,
    name: '20261008_114148_payload_3_90'
  },
];
