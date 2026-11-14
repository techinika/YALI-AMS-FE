-- Search and vector indexes.
-- `search_text` supports the directory search; `embedding` powers AI matching.

create extension if not exists pg_trgm with schema extensions;

create index if not exists profiles_search_trgm_idx
on public.profiles using gin (search_text extensions.gin_trgm_ops);

create index if not exists profiles_embedding_idx
on public.profiles using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists matchmaking_requests_embedding_idx
on public.matchmaking_requests using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists profiles_lower_first_name_idx
on public.profiles (lower(first_name));

create index if not exists profiles_lower_last_name_idx
on public.profiles (lower(last_name));