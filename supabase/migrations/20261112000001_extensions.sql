-- Extensions required by the AMS schema.
-- Supabase installs extensions into the `extensions` schema; the API roles'
-- search_path includes it. `public` objects reference these types unqualified.
create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;