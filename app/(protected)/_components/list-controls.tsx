import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function pageHref(pathname: string, query: string, page: number) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));

  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

export function SearchForm({
  action,
  query,
  placeholder = "Cari data...",
}: {
  action: string;
  query: string;
  placeholder?: string;
}) {
  return (
    <form action={action} className="flex gap-2">
      <Input
        name="q"
        defaultValue={query}
        placeholder={placeholder}
        className="min-w-0"
      />
      <Button type="submit" variant="outline">
        Cari
      </Button>
      {query ? (
        <Button asChild variant="ghost">
          <Link href={action}>Reset</Link>
        </Button>
      ) : null}
    </form>
  );
}

export function Pagination({
  pathname,
  query,
  page,
  totalPages,
}: {
  pathname: string;
  query: string;
  page: number;
  totalPages: number;
}) {
  const previousDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
      <p>
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        {previousDisabled ? (
          <Button variant="outline" size="sm" disabled>
            Sebelumnya
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={pageHref(pathname, query, page - 1)}>Sebelumnya</Link>
          </Button>
        )}
        {nextDisabled ? (
          <Button variant="outline" size="sm" disabled>
            Berikutnya
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={pageHref(pathname, query, page + 1)}>Berikutnya</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
