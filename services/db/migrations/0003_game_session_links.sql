-- Migration number: 0003 	 2025-04-19T13:54:07.120Z
create table if not exists GameSessionInvitationLink (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	gameSessionId text unique,
	code text not null unique
);
