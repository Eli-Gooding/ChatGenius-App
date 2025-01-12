-- migrate:up

-- Function to get or create a DM channel between two users in a workspace
CREATE OR REPLACE FUNCTION public.get_or_create_dm_channel(
    user1_id uuid,
    user2_id uuid,
    workspace_id uuid
)
RETURNS uuid AS $$
DECLARE
    channel_id uuid;
    sorted_user1 uuid;
    sorted_user2 uuid;
BEGIN
    -- Sort user IDs to ensure consistent channel naming
    IF user1_id < user2_id THEN
        sorted_user1 := user1_id;
        sorted_user2 := user2_id;
    ELSE
        sorted_user1 := user2_id;
        sorted_user2 := user1_id;
    END IF;

    -- Check if DM channel already exists in this workspace
    SELECT c.id INTO channel_id
    FROM channels c
    JOIN memberships m1 ON m1.channel_id = c.id
    JOIN memberships m2 ON m2.channel_id = c.id
    WHERE c.is_private = true
    AND c.workspace_id = get_or_create_dm_channel.workspace_id
    AND m1.user_id = user1_id
    AND m2.user_id = user2_id
    AND (
        SELECT COUNT(*) FROM memberships m WHERE m.channel_id = c.id
    ) = 2;

    -- If channel doesn't exist, create it
    IF channel_id IS NULL THEN
        -- Create new channel
        INSERT INTO channels (channel_name, is_private, workspace_id)
        VALUES (
            'dm_' || sorted_user1 || '_' || sorted_user2,
            true,
            get_or_create_dm_channel.workspace_id
        )
        RETURNING id INTO channel_id;

        -- Add both users to the channel
        INSERT INTO memberships (user_id, channel_id, user_role)
        VALUES
            (user1_id, channel_id, 'member'),
            (user2_id, channel_id, 'member');
    END IF;

    RETURN channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all DM channels for a user in a workspace
CREATE OR REPLACE FUNCTION public.get_user_dms(
    current_user_id uuid,
    workspace_id uuid
)
RETURNS TABLE (
    channel_id uuid,
    other_user_id uuid,
    other_user_name text,
    other_user_avatar_url text,
    is_self_dm boolean
) AS $$
BEGIN
    RETURN QUERY
    WITH user_channels AS (
        SELECT DISTINCT c.id
        FROM channels c
        JOIN memberships m ON m.channel_id = c.id
        WHERE c.is_private = true
        AND c.workspace_id = get_user_dms.workspace_id
        AND EXISTS (
            SELECT 1 FROM memberships m2
            WHERE m2.channel_id = c.id
            AND m2.user_id = current_user_id
        )
        AND (
            SELECT COUNT(*) FROM memberships m3
            WHERE m3.channel_id = c.id
        ) = 2
    ),
    other_users AS (
        SELECT DISTINCT ON (c.id)
            c.id as channel_id,
            u.id as other_user_id,
            u.user_name as other_user_name,
            u.avatar_url as other_user_avatar_url,
            u.id = current_user_id as is_self_dm
        FROM user_channels uc
        JOIN channels c ON c.id = uc.id
        JOIN memberships m ON m.channel_id = c.id
        JOIN users u ON u.id = m.user_id
        WHERE u.id != current_user_id
        OR (u.id = current_user_id AND NOT EXISTS (
            SELECT 1 FROM memberships m2
            JOIN users u2 ON u2.id = m2.user_id
            WHERE m2.channel_id = c.id
            AND u2.id != current_user_id
        ))
        ORDER BY c.id, u.id
    )
    SELECT * FROM other_users
    ORDER BY other_user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- migrate:down
DROP FUNCTION IF EXISTS public.get_or_create_dm_channel(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_dms(uuid, uuid); 