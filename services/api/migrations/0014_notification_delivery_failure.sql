-- Migration number: 0014 	 2026-04-18T16:57:07.039Z
ALTER TABLE "notification"
ADD COLUMN "deliveryFailure" text NULL;
