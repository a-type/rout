# Chess Arena

Chess Arena is a chess-inspired turn-based battle royale. Move your chess army to control the board, capture powerups, and take your opponent's pieces.

Taking the pieces of other players earns you points based on the piece's rank. The first player to 100 points wins!

## Game setup

Each player begins with a diamond-shaped placement of chess pieces: 1 of each special piece, and 8 pawns. Your pieces will be placed on the board according to the number of players in the game.

## How rounds are played

Unlike regular chess, all players take their turns simultaneously. That means more than one player might move to the same space on the same turn! We call this "M.A.D." (`M`utually `A`ssured `D`estruction) -- read more in the "Taking pieces" section.

## What you do on your turn

Each round, you move _at least_ one piece no matter what. For each king you control, you get one additional move! You _must_ move as many pieces as you are able. If you do not have enough pieces to use all your moves, you make as many moves as you have pieces (this can only happen if you only have kings).

If you collected any new pieces from powerup spaces last round, you must place them on the board during your next turn.

## Piece values

Each piece has a different point value when captured. Note that these are different from traditional chess scoring, as pawns are more powerful in Chess Arena.

- Pawn: 2 points
- Knight: 3 points
- Bishop: 3 points
- Rook: 5 points
- Queen: 9 points
- King: 15 points

> **Yes, you can capture kings!** While normal check rules apply in Chess Arena, an attacking player can follow a checkmate with a capture, and the game keeps going. Losing a king means you also lose one of your piece moves during your turn, which is a big deal! But you keep playing until the end.

## Taking pieces

Taking pieces is the key to winning, and there are several ways to do it:

**Normal capture**: Like traditional chess, when you make a valid move with one of your pieces which lands it on a square occupied by an opponent's piece, you capture it, and your piece survives.

**M.A.D. capture**: In Chess Arena, players all take their turns simultaneously. That means two (or more) pieces can move to the same square at the same time. Any pieces which move onto a square simultaneously during the same round are considered captured by every other player who moved to that square. All pieces are destroyed, and points are awarded for each other player's piece captured during the exchange.

> **Understanding M.A.D. is important!** This mechanic has significant implications for scoring and strategy. For example, suppose you engage in a M.A.D. capture with a pawn, and an opponent uses a bishop, while another opponent joins in with a rook.
> You will net 6 points, but your opponents will only net 4 -- because their pieces had more value than yours.
> As you may gather, if you're going for a M.A.D. capture, it's advantageous (but harder!) to use a lower-value piece to accomplish it. Likewise, you should be cautious with high-value pieces, as opponents may try to surprise you by anticipating your move and moving to the same square!

**Normal + M.A.D. capture**: It's possible multiple players to go for the same normal piece capture on the same round. The piece already occupying the square will be captured by all attacking players, and the owner of that piece will receive no points; meanwhile, the attacking pieces will all be mutually captured by M.A.D. rules.

> **Pro tip:** This dynamic means your pieces can be 'protected' by opponents in certain scenarios -- for example, if two opponents are in position to take your piece, they may hold off in a stalemate to avoid M.A.D. Of course, you can't count on it...

**"Sniping" a piece placement**: Certain powerups allow players to drop new pieces on the board. If you guess correctly where an opponent will drop their new piece and move a piece there, _this works like a normal capture_ -- you will take their piece and they get nothing! Note, though, that this can also turn into M.A.D. if other players make the same move.

## Check and checkmate

Normal check rules apply to kings in Chess Arena -- if your king is threatened by other players, you _must_ use any available moves to move your king out of check.

If there is no valid move which takes your king out of check, that's checkmate... but don't worry! You can still use your moves on different pieces and continue playing. You will probably lose your king on the next turn, but in this game you don't need a king to play. And, of course, you may already have another king or two in play.

That said, losing a king is a big blow -- you will lose one piece move per turn, and your opponent(s) will get lots of points.

> Since each king supplies 1 piece move for your turn, you will always have sufficient moves to respond to checks on all your kings, no matter how many are threatened.

If you put another player's king in checkmate, you are not _required_ to take it on your next turn, but you have a lot of incentive to. Watch out, as another player may also have the same king in checkmate -- leading to a M.A.D. capture. But even M.A.D. king captures are a pretty good deal.

## Powerups

Periodically throughout the game, powerups will be placed somewhere on the board. Moving a piece to a space with a powerup will capture it, allowing you to use it next turn.

There are a few types of powerups:

### New piece

This gives you a new piece to place anywhere on the board. It's very good! The type of piece you get will be shown on the powerup square.

Note: when placing your piece, this doesn't count as a capture! You cannot place a piece on a square occupied by an opponent, and if an opponent moves to the square you place on, only your piece is lost -- it doesn't count as M.A.D. Watch out for sniping!

### Upgrade

Taking this powerup allows you to change the type of the piece that captured it, kind of like reaching the back of the board with a pawn in traditional chess. You can convert any piece into any other type of piece, except king. Like normal chess, you're _probably_ picking queen, right?

### King me

This powerup converts the capturing piece into a king. It's the most reliable way to get yourself another king in the game. Just watch out once you take it -- kings can't move very quickly and can get into check. Jumping in to take this powerup in a section of the board controlled by opponents might just give them an easy king capture!

## Differences from traditional chess

Here's a cheat sheet to summarize the differences in rules between Chess Arena and traditional chess:

- Checkmate does not end the game. Kings can be captured.
- En passant does not exist.
- Castling does not exist.
- Pawns are not promoted when reaching the edge of the board.
- Pawns can move in any cardinal direction and capture any diagonal space.
- More than 2 people can play together.
- Players can often move more than 1 piece.
- Powerups.
