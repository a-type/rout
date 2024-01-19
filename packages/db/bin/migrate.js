#!/usr/bin/env node

import { migrateToLatest } from '../dist/esm/migrate.js';
import { db } from '../dist/esm/index.js';

migrateToLatest();

await db.destroy();
