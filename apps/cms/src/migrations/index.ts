import * as migration_20260528_233905_initial from './20260528_233905_initial';
import * as migration_20261004_112256_site_publish_reservations from './20261004_112256_site_publish_reservations';
import * as migration_20261008_114148_payload_3_90 from './20261008_114148_payload_3_90';
import * as migration_20261104_085127_resource_renames from './20261104_085127_resource_renames';

import * as migration_20261105_091120_user_roles from './20261105_091120_user_roles';

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
    name: '20261008_114148_payload_3_90',
  },
  {
    up: migration_20261104_085127_resource_renames.up,
    down: migration_20261104_085127_resource_renames.down,
    name: '20261104_085127_resource_renames'
  },
  {
    up: migration_20261105_091120_user_roles.up,
    down: migration_20261105_091120_user_roles.down,
    name: '20261105_091120_user_roles'
  },
];
