-- Allow admins to update roles (was missing, breaking "Change Role")
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- Clean up duplicate role rows: keep only the highest-privilege role per user
WITH ranked AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'contador' THEN 2
        WHEN 'cliente' THEN 3
        WHEN 'user' THEN 4
        WHEN 'viewer' THEN 5
        ELSE 6
      END
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Ensure one role per user going forward
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);