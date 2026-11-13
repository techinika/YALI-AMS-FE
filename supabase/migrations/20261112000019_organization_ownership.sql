-- Organization ownership.
--
-- Any member may create an organization (organizations_insert allows
-- added_by = auth.uid()). Without matching write access, the creator could not
-- edit the organization or manage its working sectors, which made the create
-- flow fail at the last step. Grant the creator the same rights as an admin for
-- the organization and its working sectors.

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
for update to authenticated
using (public.is_admin() or added_by = auth.uid())
with check (public.is_admin() or added_by = auth.uid());

drop policy if exists organization_working_sectors_write on public.organization_working_sectors;
create policy organization_working_sectors_write on public.organization_working_sectors
for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.organizations o
    where o.id = organization_working_sectors.organization_id
      and o.added_by = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.organizations o
    where o.id = organization_working_sectors.organization_id
      and o.added_by = auth.uid()
  )
);