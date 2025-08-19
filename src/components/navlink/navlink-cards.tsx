"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";
import type Navlink from "~/server/api/types/paynow/navlink";
import { api } from "~/trpc/react";
import HoverAnimateImage from "../hover-image";
import { Card, CardTitle } from "../ui/card";

export default function NavlinkCards() {
  const { data: navlinks } = api.paynow.getNavlinks.useQuery();

  if (!navlinks?.length) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {(navlinks || []).map((navlink) => (
        <NavlinkCard key={navlink.node_id} navlink={navlink} />
      ))}
    </div>
  );
}

function NavlinkCard({ navlink }: { navlink: Navlink }) {
  const { data: tags } = api.paynow.getTags.useQuery();

  const tag = tags?.find((x) => x.id === navlink.tag_id);

  return (
    <Link href={`/category/${navlink.tag_slug}`}>
      <Card className="group relative m-0 h-32 cursor-pointer overflow-hidden p-0">
        <CardTitle className="flex h-full items-center gap-8 px-12 py-8">
          {tag?.image_url && (
            <div className="flex-shrink-0">
              <HoverAnimateImage
                src={tag.image_url}
                alt={tag.name}
                width={75}
                height={75}
                className="aspect-square h-[75px] w-[75px] object-cover"
              />
            </div>
          )}

          <div className="flex flex-1 items-center justify-between gap-4">
            <h1 className="truncate font-bold text-2xl">{navlink.name}</h1>

            <span className="flex-shrink-0">
              <ArrowRightIcon
                className="opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100"
                size={24}
                weight="bold"
              />
            </span>
          </div>
        </CardTitle>
      </Card>
    </Link>
  );
}
