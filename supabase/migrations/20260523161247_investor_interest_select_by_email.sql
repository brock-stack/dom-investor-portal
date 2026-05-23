-- v2.3.3 — let an authenticated portal user SELECT investor_interest rows they themselves submitted,
-- matched by session email vs meta.email captured at insert time.
-- This complements (does not replace) investor_read_own and team_read_investor_interest.
-- Together the three permissive policies cover: team members (any row),
-- linked CRM contacts (via investor_id), and self-identified portal users (via meta.email).

create policy "investor_read_own_by_email" on public.investor_interest
  for select
  to authenticated
  using (
    auth.email() is not null
    and (meta ->> 'email') = auth.email()
  );
