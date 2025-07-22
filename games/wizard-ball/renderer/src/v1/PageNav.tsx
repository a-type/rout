import { Button, clsx } from '@a-type/ui';
import { NavLink, useSearchParams } from 'react-router';
import { hooks } from './gameClient.js';

export function PageNav() {
  const {
    submitTurn,
    gameStatus,
    turnError,
    nextRoundCheckAt,
    finalState,
    playerId,
  } = hooks.useGameSuite();

  const myTeamId = Object.entries(finalState.league.teamLookup).find(
    ([, team]) => team.ownerId === playerId,
  )?.[0];
  const [searchParams] = useSearchParams();
  const active =
    searchParams.get('league') !== null
      ? 'league'
      : searchParams.get('teamId') !== null
        ? 'team'
        : searchParams.get('debug') !== null
          ? 'debug'
          : 'home';

  const activeClass = 'font-bold color-gray-ink transition-colors';
  const inActiveClass =
    'color-gray-dark hover:color-gray-ink transition-colors';

  return (
    <div className="fixed flex gap-4 bg-wash p-4 w-full z-10 items-center max-h-[4rem]">
      {!nextRoundCheckAt && (
        <Button
          onClick={() => {
            submitTurn();
          }}
        >
          Next round
        </Button>
      )}
      <NavLink
        to={{
          search: '',
        }}
        className={clsx(active === 'home' ? activeClass : inActiveClass)}
      >
        Home
      </NavLink>
      {gameStatus.status !== 'complete' && (
        <NavLink
          to={{
            search: 'league',
          }}
          className={clsx(active === 'league' ? activeClass : inActiveClass)}
        >
          League
        </NavLink>
      )}
      <NavLink
        to={{
          search: `teamId=${myTeamId}`,
        }}
        className={clsx(active === 'team' ? activeClass : inActiveClass)}
      >
        My Team
      </NavLink>
      <NavLink
        to={{
          search: 'debug',
        }}
        className={clsx(active === 'debug' ? activeClass : inActiveClass)}
      >
        Debug
      </NavLink>
      {turnError?.message}
    </div>
  );
}
