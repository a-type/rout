import { Box, clsx } from '@a-type/ui';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <Box
      layout="center center"
      className={clsx('text-xs color-gray-dark', className)}
      full="width"
    >
      <Box className="w-full max-w-600px" gap justify="between" p>
        <Box d="col" gap>
          &copy; 2025 Grant Forrest.
          <br /> All rights reserved.
        </Box>
        <Box d="col" gap align="end">
          <a href="https://www.rout.games/privacy">Privacy Policy</a>
          <a href="https://www.rout.games/tos">Terms of Service</a>
        </Box>
      </Box>
    </Box>
  );
}
