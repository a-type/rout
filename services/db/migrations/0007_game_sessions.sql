create table if not exists GameSession (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	status text not null default 'pending'
);

-- backfill sessions for all invitations

insert into GameSession (id)
select gameSessionId
from (select distinct gameSessionId from GameSessionInvitation);

-- update GameSessionInvitation and GameSessionInvitationLink tables
-- to point to the new GameSession table with foreign keys and
-- cascade delete
-- Since SQLite doesn't support adding constraints to tables,
-- we have to copy data to a temp table and drop the old one
-- before renaming the temp table to the original name

create table GameSessionInvitationTemp (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	gameSessionId text not null references GameSession(id) on delete cascade,
	inviterId text not null references User(id) on delete cascade,
	userId text not null references User(id) on delete cascade,
	expiresAt datetime not null,
	status text not null,
	role text not null,

	constraint GameSessionInvitation_role_check check (role in ('player', 'spectator')),
	constraint GameSessionInvitation_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked')),
	constraint GameSessionInvitation_gameSessionId_userId_unique unique (gameSessionId, userId)
);

insert into GameSessionInvitationTemp (id, createdAt, updatedAt, gameSessionId, inviterId, userId, expiresAt, status, role)
select id, createdAt, updatedAt, gameSessionId, inviterId, userId, expiresAt, status, role
from GameSessionInvitation
where gameSessionId in (select id from GameSession);
drop table GameSessionInvitation;
alter table GameSessionInvitationTemp rename to GameSessionInvitation;

create table GameSessionInvitationLinkTemp (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	gameSessionId text unique not null references GameSession(id) on delete cascade,
	code text not null unique
);
insert into GameSessionInvitationLinkTemp (id, createdAt, updatedAt, gameSessionId, code)
select id, createdAt, updatedAt, gameSessionId, code
from GameSessionInvitationLink
where gameSessionId in (select id from GameSession);
drop table GameSessionInvitationLink;
alter table GameSessionInvitationLinkTemp rename to GameSessionInvitationLink;
