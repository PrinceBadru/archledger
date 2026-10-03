"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { SearchableComponent } from "@/lib/catalog/search";
import Link from "next/link";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-md group">
      <Input
        type="search"
        placeholder="Search components..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
      
      {query.trim() && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map(r => (
                <li key={r.id}>
                  <Link href={`/dashboard/components/${r.id}`} className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="font-semibold text-sm">{r.name}</div>
                    {r.description && <div className="text-xs text-gray-500 truncate">{r.description}</div>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-gray-500">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}
