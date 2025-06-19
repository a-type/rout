-- Migration number: 0011 	 2025-06-18T20:24:02.476Z

-- adds the 'abandoned' status to game session inivitations and

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
	constraint GameSessionInvitation_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked', 'abandoned')),
	constraint GameSessionInvitation_gameSessionId_userId_unique unique (gameSessionId, userId)
);

insert into GameSessionInvitationTemp (id, createdAt, updatedAt, gameSessionId, inviterId, userId, expiresAt, status, role)
select id, createdAt, updatedAt, gameSessionId, inviterId, userId, expiresAt, status, role
from GameSessionInvitation
where gameSessionId in (select id from GameSession);

drop table GameSessionInvitation;
alter table GameSessionInvitationTemp rename to GameSessionInvitation;
