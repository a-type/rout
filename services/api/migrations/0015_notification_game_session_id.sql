-- Migration number: 0015 	 2026-04-18T17:06:13.882Z
ALTER TABLE "notification"
ADD COLUMN "gameSessionIds" text NULL;
