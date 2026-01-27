-- Migration number: 0004 - 2025-04-22T14:22:09.220Z

alter table User
	add column notificationSettings text default '{}';

create table if not exists Notification (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	userId text not null references User(id) on delete cascade,
	data text not null,
	readAt datetime
);
