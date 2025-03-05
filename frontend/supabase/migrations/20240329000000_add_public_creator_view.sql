-- Create public view for creator profiles
CREATE OR REPLACE VIEW public.public_creator_details AS
SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', g.id,
                'name', g.name,
                'description', g.description,
                'status', g.status,
                'plans', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', pl.id,
                            'name', pl.name,
                            'description', pl.description,
                            'price', pl.price,
                            'features', pl.features
                        )
                    )
                    FROM plans pl
                    WHERE pl.group_id = g.id
                    ORDER BY pl.price ASC
                    LIMIT 3
                )
            )
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'::jsonb
    ) as groups
FROM profiles p
LEFT JOIN groups g ON g.creator_id = p.id AND g.status = 'active'
WHERE p.role = 'creator'
GROUP BY p.id, p.full_name, p.avatar_url;

-- Grant public access to the view
GRANT SELECT ON public.public_creator_details TO anon;
GRANT SELECT ON public.public_creator_details TO authenticated;

-- Create policy for public access to profiles for creators
CREATE POLICY "Public can view creator profiles" ON profiles
    FOR SELECT
    USING (role = 'creator');

-- Create policy for public access to active groups
CREATE POLICY "Public can view active groups" ON groups
    FOR SELECT
    USING (status = 'active');

-- Create policy for public access to active plans
CREATE POLICY "Public can view active plans" ON plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = plans.group_id
            AND groups.status = 'active'
        )
    ); 