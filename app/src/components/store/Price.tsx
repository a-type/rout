import { SlotDiv } from '@a-type/ui';
import cls from './Price.module.css';

export const Price = ({
  product,
  className,
  ...rest
}: {
  product: { priceCents: number; isOwned: boolean };
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <SlotDiv className={cls.root} data-owned={product.isOwned} {...rest}>
      {product.isOwned
        ? 'Owned'
        : product.priceCents === 0
          ? 'Free'
          : `$${product.priceCents / 100}`}
    </SlotDiv>
  );
};
