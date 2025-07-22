import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  Chip,
  Dialog,
  FieldArray,
  FormikForm,
  H3,
  Icon,
  Select,
  SubmitButton,
  TextAreaField,
  TextField,
  useValues,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { useSearchParams } from '@verdant-web/react-router';

export interface AdminEditProductProps {}

export function AdminEditProduct({}: AdminEditProductProps) {
  const [search] = useSearchParams();
  const productId: PrefixedId<'gp'> = search.get(
    'productId',
  )! as PrefixedId<'gp'>;

  if (!productId) {
    return null;
  }

  return <AdminEditProductContent productId={productId} />;
}

function AdminEditProductContent({
  productId,
}: {
  productId: PrefixedId<'gp'>;
}) {
  const [, setSearch] = useSearchParams();
  const { data: initialProduct } = sdkHooks.useGetGameProduct({
    id: productId!,
  });
  const updateProduct = sdkHooks.useAdminUpdateGameProduct();
  const deleteProduct = sdkHooks.useAdminDeleteGameProduct();
  const addItem = sdkHooks.useAdminAddGameProductItem();
  const removeItem = sdkHooks.useAdminRemoveGameProductItem();

  const publish = () => {
    updateProduct.mutate({
      id: productId!,
      publishedAt: new Date().toISOString(),
    });
  };

  if (!initialProduct) {
    return null;
  }

  return (
    <Dialog
      open={!!productId}
      onOpenChange={(open) => {
        if (!open) {
          setSearch((prev) => {
            prev.delete('productId');
            return prev;
          });
        }
      }}
    >
      <Dialog.Content width="md">
        <Dialog.Title>Edit Product</Dialog.Title>
        <FormikForm
          initialValues={{
            name: initialProduct.name,
            description: initialProduct.description,
            priceCents: initialProduct.priceCents,
            items: initialProduct.gameProductItems.map((item) => item.gameId),
          }}
          onSubmit={async (values) => {
            await updateProduct.mutateAsync({
              id: productId!,
              name: values.name,
              description: values.description,
              priceCents: values.priceCents,
            });

            const addedItems = values.items.filter(
              (item) =>
                !initialProduct.gameProductItems.some((i) => i.gameId === item),
            );
            const removedItems = initialProduct.gameProductItems.filter(
              (item) => !values.items.some((i) => i === item.gameId),
            );

            if (addedItems.length) {
              for (const item of addedItems) {
                await addItem.mutateAsync({
                  id: productId!,
                  gameId: item,
                });
              }
            }
            if (removedItems.length) {
              for (const item of removedItems) {
                await removeItem.mutateAsync({
                  id: productId!,
                  itemId: item.id,
                });
              }
            }

            setSearch((prev) => {
              prev.delete('productId');
              return prev;
            });
          }}
        >
          <TextField name="name" label="Name" />
          <TextAreaField name="description" label="Description" />
          <TextField name="priceCents" label="Price (CENTS)" type="number" />
          <ProductItemField />
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button
              color="destructive"
              onClick={() => {
                const ok = confirm(
                  'Are you sure you want to delete this product? If anyone owns it, it will only be unpublished',
                );
                if (ok) {
                  deleteProduct.mutateAsync({ id: productId! });
                  setSearch((prev) => {
                    prev.delete('productId');
                    return prev;
                  });
                }
              }}
            >
              Delete Product
            </Button>
            {!initialProduct.publishedAt && (
              <Button color="accent" onClick={publish}>
                Publish
              </Button>
            )}
            <SubmitButton color="primary">Save</SubmitButton>
          </Dialog.Actions>
        </FormikForm>
      </Dialog.Content>
    </Dialog>
  );
}

function ProductItemField() {
  const values = (useValues() as any)['items'] as string[];
  const games = sdkHooks.useGetGames().data || {};

  return (
    <FieldArray name="items">
      {(arrayHelpers) => (
        <Box d="col" gap>
          <H3>Games</H3>
          <Box gap wrap>
            {values.map((gameId: string) => (
              <Chip
                key={gameId}
                onClick={() => arrayHelpers.remove(values.indexOf(gameId))}
              >
                {games[gameId].title}
                <Icon name="x" />
              </Chip>
            ))}
          </Box>
          <Select value="" onValueChange={arrayHelpers.push}>
            <Select.Trigger>
              <Select.Value placeholder="Add Game" />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content>
              {Object.keys(games)
                .filter((gameId) => !values.includes(gameId))
                .map((gameId) => (
                  <Select.Item key={gameId} value={gameId}>
                    {games[gameId].title}
                  </Select.Item>
                ))}
            </Select.Content>
          </Select>
        </Box>
      )}
    </FieldArray>
  );
}
