interface EntityRef {
  instanceData?: {
    instance_id?: string | null;
  } | null;
  variant_id?: string | null;
}

export const getEntityKey = (value: EntityRef | null | undefined): string => {
  return (
    value?.instanceData?.instance_id ??
    value?.variant_id ??
    ''
  );
};
