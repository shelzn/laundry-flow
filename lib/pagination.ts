export const DEFAULT_PAGE_SIZE = 10;

export type PageSearchParams = {
  q?: string | string[];
  page?: string | string[];
};

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getListParams(searchParams?: PageSearchParams) {
  const query = (firstParam(searchParams?.q) ?? "").trim();
  const parsedPage = Number(firstParam(searchParams?.page) ?? "1");
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return {
    query,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    offset: (page - 1) * DEFAULT_PAGE_SIZE,
  };
}

export function getTotalPages(total: number, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}
