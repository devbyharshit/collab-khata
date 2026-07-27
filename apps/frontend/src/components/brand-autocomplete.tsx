"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Brand } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface BrandAutocompleteProps {
  id?: string;
  brands: Brand[];
  value: number | undefined;
  onChange: (value: number) => void;
  onBrandCreated: (brand: Brand) => void;
}

interface BrandfetchResult {
  brandId: string;
  name: string;
  domain: string;
  icon: string;
}

export function BrandAutocomplete({
  id,
  brands,
  value,
  onChange,
  onBrandCreated,
}: BrandAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [externalBrands, setExternalBrands] = React.useState<
    BrandfetchResult[]
  >([]);
  const [isLoadingExternal, setIsLoadingExternal] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  React.useEffect(() => {
    async function searchExternalBrands() {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setExternalBrands([]);
        return;
      }

      setIsLoadingExternal(true);
      try {
        const res = await fetch(
          `https://api.brandfetch.io/v2/search/${encodeURIComponent(debouncedSearch)}`
        );
        if (res.ok) {
          const data = await res.json();
          setExternalBrands(data);
        }
      } catch (error) {
        console.error("Failed to fetch external brands", error);
      } finally {
        setIsLoadingExternal(false);
      }
    }

    searchExternalBrands();
  }, [debouncedSearch]);

  const selectedBrand = brands.find((brand) => brand.id === value);

  const handleCreateBrand = async (name: string) => {
    try {
      setIsCreating(true);
      const response = await apiClient.post<Brand>("/api/brands/", { name });
      onBrandCreated(response.data);
      onChange(response.data.id);
      setOpen(false);
      toast.success("Brand created successfully");
    } catch (error: any) {
      toast.error(error?.error?.message || "Failed to create brand");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter local brands
  const filteredLocalBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 bg-white/50 backdrop-blur-sm border-2 font-normal hover:bg-white/80"
        >
          {selectedBrand ? selectedBrand.name : "Select or search a brand..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 sm:w-[400px] max-h-[300px] flex flex-col overflow-hidden"
        align="start"
        portal={false}
      >
        <Command
          shouldFilter={false}
          className="w-full h-full flex flex-col overflow-hidden"
        >
          <CommandInput
            placeholder="Search brands..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="flex-1 max-h-full overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm">
              {isLoadingExternal ? (
                <div className="flex items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p>No brands found.</p>
                  {searchQuery && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCreateBrand(searchQuery)}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Create &quot;{searchQuery}&quot;
                    </Button>
                  )}
                </div>
              )}
            </CommandEmpty>

            {filteredLocalBrands.length > 0 && (
              <CommandGroup heading="Your Brands">
                {filteredLocalBrands.map((brand) => (
                  <CommandItem
                    key={`local-${brand.id}`}
                    value={`local-${brand.id}`}
                    onSelect={() => {
                      onChange(brand.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === brand.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {brand.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {externalBrands.length > 0 && (
              <CommandGroup heading="Suggestions (Brandfetch)">
                {externalBrands.map((brand) => (
                  <CommandItem
                    key={`ext-${brand.brandId}`}
                    value={`ext-${brand.brandId}`}
                    onSelect={() => handleCreateBrand(brand.name)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                    {brand.icon ? (
                      <img
                        src={brand.icon}
                        alt={brand.name}
                        className="w-6 h-6 rounded-md object-contain bg-white"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                        <Search className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                    <span>{brand.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {brand.domain}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchQuery &&
              !filteredLocalBrands.some(
                (b) => b.name.toLowerCase() === searchQuery.toLowerCase()
              ) && (
                <CommandGroup heading="Create">
                  <CommandItem
                    value={`create-${searchQuery}`}
                    onSelect={() => handleCreateBrand(searchQuery)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create custom brand &quot;{searchQuery}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
