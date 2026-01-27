-- When I made Account table I forgot to add ON DELETE CASCADE to userId foreign key.
-- SQLite doesn't support adding this post-hoc so we have to recreate the table.

create table Account_new (
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

	foreign key (userId) references User(id) on delete cascade
);

insert into Account_new
select * from Account;

drop table Account;
alter table Account_new rename to Account;

-- Recreate the index
create index Account_userId_index on Account(userId);
-- Recreate the index
create index Account_providerAccountId_index on Account(providerAccountId);
