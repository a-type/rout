-- Migration number: 0001 	 2025-01-03T16:48:36.721Z

create table User (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	displayName text not null,
	email text not null unique,
	imageUrl text,
	password text,
	emailVerifiedAt datetime,
	color text null
);

create table Account (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	userId text not null,
	type text not null,
	provider text not null,
	providerAccountId text not null,
	refreshToken text,
	accessToken text,
	tokenType text,
	accessTokenExpiresAt datetime,
	scope text,
	idToken text,

	foreign key (userId) references User(id)
);

create table VerificationCode (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	email text not null,
	code text not null,
	name text not null,
	expiresAt datetime not null
);

create index VerificationCode_code_index on VerificationCode
(code);
create index VerificationCode_email_index on VerificationCode(email);

create table Friendship (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	userId text not null references User(id) on delete cascade,
	friendId text not null references User(id) on delete cascade,
	initiatorId text not null references User(id) on delete cascade,

	constraint Friendship_userId_not_equal_friendId check (userId != friendId),
	constraint Friendship_userId_friendId_ordering check (userId < friendId),
	constraint Friendship_userId_friendId_unique unique (userId, friendId)
);

create table FriendshipInvitation (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	inviterId text not null references User(id) on delete cascade,
	email text not null,
	status text not null default 'pending',
	expiresAt datetime not null,

	constraint FriendshipInvitation_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked')),
	constraint FriendshipInvitation_inviterId_email_unique unique (inviterId, email)
);

create index FriendshipInvitation_email_index on FriendshipInvitation(email);

create table GameSessionInvitation (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	-- game sessions are durable objects; no foreign key here.
	gameSessionId text not null,
	inviterId text references User(id) on delete set null,
	userId text not null references User(id) on delete cascade,
	role text not null default 'player',
	status text not null default 'pending',
	expiresAt datetime not null,

	constraint GameSessionInvitation_role_check check (role in ('player', 'spectator')),
	constraint GameSessionInvitation_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked')),
	constraint GameSessionInvitation_gameSessionId_userId_unique unique (gameSessionId, userId)
);
