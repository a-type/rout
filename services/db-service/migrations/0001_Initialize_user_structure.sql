-- Migration number: 0001 	 2025-01-03T16:48:36.721Z

create table User (
	id text primary key,
	createdAt datetime default CURRENT_TIMESTAMP not null,
	updatedAt datetime default CURRENT_TIMESTAMP not null,
	fullName text not null,
	friendlyName text not null,
	email text not null unique,
	imageUrl text,
	password text,
	emailVerifiedAt datetime
);

create table Account (
	id text primary key,
	createdAt datetime default CURRENT_TIMESTAMP not null,
	updatedAt datetime default CURRENT_TIMESTAMP not null,
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
	createdAt datetime default CURRENT_TIMESTAMP not null,
	updatedAt datetime default CURRENT_TIMESTAMP not null,
	email text not null,
	code text not null,
	name text not null,
	expiresAt datetime not null
);

create index VerificationCode_code_index on VerificationCode
(code);
create index VerificationCode_email_index on VerificationCode(email);
