CREATE POLICY "Admins can manage company uploads"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'company-uploads' AND private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'company-uploads' AND private.has_role(auth.uid(), 'admin'::app_role));