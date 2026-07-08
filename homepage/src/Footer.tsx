import { Box, clsx } from '@a-type/ui';
import cls from './Footer.module.css';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <Box
      layout="center center"
      className={clsx(cls.root, className)}
      full="width"
    >
      <Box className={cls.content} gap justify="between" p>
        <Box col gap>
          &copy; 2025 Grant Forrest.
          <br /> All rights reserved.
        </Box>
        <Box col gap items="end">
          <a href="https://www.rout.games/privacy">Privacy Policy</a>
          <a href="https://www.rout.games/tos">Terms of Service</a>
        </Box>
      </Box>
    </Box>
  );
}
