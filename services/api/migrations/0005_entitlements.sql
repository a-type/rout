create table if not exists UserGamePurchase (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	userId text not null references User(id) on delete cascade,
	gameId text not null
);
create index UserGamePurchase_userId on UserGamePurchase(userId);

alter table User
	add column stripeCustomerId text;
create index User_stripeCustomerId_index on User(stripeCustomerId);

alter table User
	add column subscriptionEntitlements text not null default '{}';
