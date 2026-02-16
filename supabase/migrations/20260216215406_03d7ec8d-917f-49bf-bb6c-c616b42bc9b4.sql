
CREATE TABLE public.proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals_v2(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_cy numeric,
  total_standard numeric,
  total_optional numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (proposal_id, version_number)
);

ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own versions"
  ON public.proposal_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own versions"
  ON public.proposal_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own versions"
  ON public.proposal_versions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_proposal_versions_proposal_id
  ON public.proposal_versions(proposal_id, version_number DESC);
