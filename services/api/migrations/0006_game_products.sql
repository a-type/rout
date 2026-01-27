alter table UserGamePurchase
	drop column gameId;

-- !!! Removes all data (right now there's none... I'm on a branch... but still.)
delete from UserGamePurchase;

create table if not exists GameProduct (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	priceCents integer not null,
	publishedAt datetime,
	name text not null,
	description text
);

create table if not exists GameProductItem (
	id text primary key,
	createdAt datetime default (strftime('%FT%R:%fZ')) not null,
	updatedAt datetime default (strftime('%FT%R:%fZ')) not null,
	gameProductId text not null references GameProduct(id) on delete cascade,
	gameId text not null,
	unique(gameProductId, gameId)
);

create index GameProductItem_gameProductId on GameProductItem(gameProductId);
create index GameProductItem_gameId on GameProductItem(gameId);

alter table UserGamePurchase
	add column gameProductId text not null references GameProduct(id) on delete cascade;

alter table User
	add column isProductAdmin boolean default false;
