"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";

interface UserAvatarProps {
  avatarUrl?: string | null;
  photoURL?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  size?: number;
  alt?: string;
}

export function UserAvatar({
  avatarUrl,
  photoURL,
  name,
  email,
  className,
  size = 40,
  alt = "Avatar"
}: UserAvatarProps) {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || 'AliBank')}&background=F59E0B&color=000000&bold=true&size=256`;
  const [src, setSrc] = useState<string>(() => getAvatarUrl(avatarUrl, photoURL, name, email));

  useEffect(() => {
    setSrc(getAvatarUrl(avatarUrl, photoURL, name, email));
  }, [avatarUrl, photoURL, name, email]);

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("w-full h-full object-cover", className)}
      onError={() => {
        if (src !== fallbackUrl) {
          setSrc(fallbackUrl);
        }
      }}
      loading="lazy"
    />
  );
}
