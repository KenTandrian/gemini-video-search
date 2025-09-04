"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import type { Facet } from "@/types/search";
import { ChevronsUpDown } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FacetFilterProps = {
  facets: Facet[];
};

export function FacetFilter({ facets }: FacetFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleFacetChange(
    facetKey: string,
    facetValue: string,
    isChecked: boolean
  ) {
    const newSearchParams = new URLSearchParams(searchParams);
    const existingValues = newSearchParams.getAll(facetKey);

    if (isChecked) {
      if (!existingValues.includes(facetValue)) {
        newSearchParams.append(facetKey, facetValue);
      }
    } else {
      const newValues = existingValues.filter((v) => v !== facetValue);
      newSearchParams.delete(facetKey);
      newValues.forEach((v) => newSearchParams.append(facetKey, v));
    }

    router.replace(`${pathname}?${newSearchParams.toString()}` as Route);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Refine your search by filtering by persons, organizations, and tags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!facets?.length && <p>No filters.</p>}
        {facets.map((facet) => (
          <Collapsible key={facet.key} defaultOpen>
            <CollapsibleTrigger className="font-semibold w-full text-left flex justify-between items-center">
              {facet.key}
              <ChevronsUpDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-1 pt-2">
                {facet.values.map((value) => (
                  <li key={value.value} className="flex items-center py-1">
                    <Checkbox
                      id={`${facet.key}-${value.value}`}
                      checked={searchParams
                        .getAll(facet.key)
                        .includes(value.value)}
                      onCheckedChange={(isChecked) =>
                        handleFacetChange(
                          facet.key,
                          value.value,
                          isChecked as boolean
                        )
                      }
                      className="mr-2"
                    />
                    <Label htmlFor={`${facet.key}-${value.value}`}>
                      {value.value} ({value.count})
                    </Label>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
