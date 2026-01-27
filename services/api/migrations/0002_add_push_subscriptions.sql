-- Migration number: 0002 	 2025-04-14T13:29:08.034Z

create table PushSubscription (
	endpoint text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	userId text references User(id) on delete set null,
	expirationTime datetime null,
	p256dh text null,
	auth text null
);
