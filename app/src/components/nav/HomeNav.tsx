import {
  Button,
  ButtonProps,
  clsx,
  CollapsibleSimple,
  H2,
  Icon,
  IconName,
} from '@a-type/ui';
import { ReactNode, useEffect } from 'react';
import { proxy, useSnapshot } from 'valtio';

const icons = {
  live: 'gamePiece' as IconName,
  hotseat: 'phone' as IconName,
  upcoming: 'calendar' as IconName,
  invites: 'send' as IconName,
} as const;

export type SectionName = keyof typeof icons;

const activeState = proxy({
  activeSection: 'live' as SectionName,
});

export const HomeNavRoot = ({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  className?: string;
}) => {
  useEffect(() => {
    function onScroll() {
      const sections = Object.keys(icons) as SectionName[];
      let foundSection: SectionName | null = null;
      let topMost = Infinity;
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= -rect.height / 2 && rect.top < topMost) {
            topMost = rect.top;
            foundSection = section;
          }
        }
      }
      if (foundSection) {
        activeState.activeSection = foundSection;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className={clsx('flex flex-col gap-sm pb-25vh', className)} {...rest}>
      {children}
    </div>
  );
};

export function HomeNavSection({
  children,
  id,
  className,
  title,
  ...rest
}: {
  children: ReactNode;
  id: SectionName;
  className?: string;
  title: string;
}) {
  return (
    <section
      id={id}
      className={clsx(
        'flex flex-col gap-md [scroll-snap-align:start] min-h-20vh',
        className,
      )}
      {...rest}
    >
      <H2 className="text-md uppercase my-0 mx-md flex flex-row gap-sm items-center">
        <Icon name={icons[id]} /> {title}
      </H2>
      {children}
    </section>
  );
}

export interface HomeNavTriggersProps {
  className?: string;
}

export function HomeNavTriggers({ className, ...rest }: HomeNavTriggersProps) {
  return (
    <nav
      className={clsx(
        'sticky top-sm flex flex-row gap-xs z-10 justify-end flex-1',
        className,
      )}
      {...rest}
    >
      <HomeNavTrigger target="live">Live</HomeNavTrigger>
      <HomeNavTrigger target="hotseat">Hotseat</HomeNavTrigger>
      <HomeNavTrigger target="upcoming">Upcoming</HomeNavTrigger>
      <HomeNavTrigger target="invites">Invites</HomeNavTrigger>
    </nav>
  );
}

function HomeNavTrigger({
  target,
  children,
  ...rest
}: { target: SectionName } & ButtonProps) {
  const scrollHandler = () => {
    const element = document.getElementById(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      // manually set - even if scroll doesn't reach it
      activeState.activeSection = target;
    }, 300);
  };

  const active = useSnapshot(activeState).activeSection === target;

  return (
    <Button
      toggled={active}
      toggleMode="color"
      emphasis="light"
      onClick={scrollHandler}
      className={clsx('gap-0', active ? 'flex-1' : 'p-sm bg-white')}
      {...rest}
    >
      <Icon name={icons[target]} />
      <CollapsibleSimple horizontal open={active} className="flex-1">
        <div className="pl-xs whitespace-nowrap text-center">{children}</div>
      </CollapsibleSimple>
    </Button>
  );
}
