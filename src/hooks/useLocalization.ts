export function useLocalization() {
  const materialTable = {
    toolbar: {
      searchTooltip: 'Search',
      PLACEHOLDER_SEARCH: 'Search',
    },
    header: {
      actions: 'Actions',
    },
    body: {
      emptyDataSourceMessage: 'Can not find any items',
    },
  };

  return { materialTable };
}
