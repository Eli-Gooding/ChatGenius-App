-- migrate:up

-- Function to create a channel and add creator as member atomically
CREATE OR REPLACE FUNCTION public.create_channel_with_membership(
    p_channel_name text,
    p_channel_description text,
    p_workspace_id uuid,
    p_is_private boolean
)
RETURNS uuid AS $$
DECLARE
    v_channel_id uuid;
BEGIN
    -- Create the channel
    INSERT INTO channels (
        channel_name,
        channel_description,
        workspace_id,
        created_by,
        is_private
    )
    VALUES (
        p_channel_name,
        p_channel_description,
        p_workspace_id,
        auth.uid(),
        p_is_private
    )
    RETURNING id INTO v_channel_id;

    -- Add creator as member
    INSERT INTO memberships (
        channel_id,
        user_id,
        user_role
    )
    VALUES (
        v_channel_id,
        auth.uid(),
        'admin'
    );

    RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    IF user1_id = user2_id THEN
        -- For self-DMs, look for a channel where the user is the only member
        SELECT c.id INTO channel_id
        FROM channels c
        JOIN memberships m ON m.channel_id = c.id
        WHERE c.is_private = true
        AND c.workspace_id = get_or_create_dm_channel.workspace_id
        AND m.user_id = user1_id
        AND (
            SELECT COUNT(*) FROM memberships m2 WHERE m2.channel_id = c.id
        ) = 1;
    ELSE
        -- For regular DMs, look for a channel with both users
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
    END IF;

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

        -- Add user(s) to the channel
        IF user1_id = user2_id THEN
            -- For self-DMs, add only the user once
            INSERT INTO memberships (user_id, channel_id, user_role)
            VALUES (user1_id, channel_id, 'member');
        ELSE
            -- For regular DMs, add both users
            INSERT INTO memberships (user_id, channel_id, user_role)
            VALUES
                (user1_id, channel_id, 'member'),
                (user2_id, channel_id, 'member');
        END IF;
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
        -- Get all DM channels the current user is a member of
        SELECT DISTINCT c.id as channel_id
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
        ) IN (1, 2)  -- Allow both single-member (self-DM) and two-member channels
    ),
    channel_members AS (
        -- Get all members of these channels
        SELECT 
            uc.channel_id,
            u.id as user_id,
            u.user_name,
            u.avatar_url,
            (SELECT COUNT(*) = 1 FROM memberships m4 WHERE m4.channel_id = uc.channel_id) as is_self_dm
        FROM user_channels uc
        JOIN memberships m ON m.channel_id = uc.channel_id
        JOIN users u ON u.id = m.user_id
    )
    SELECT DISTINCT ON (cm.channel_id)
        cm.channel_id,
        CASE 
            WHEN cm.is_self_dm THEN cm.user_id
            WHEN cm.user_id = current_user_id THEN (
                SELECT user_id 
                FROM channel_members cm2
                WHERE cm2.channel_id = cm.channel_id 
                AND cm2.user_id != current_user_id
                LIMIT 1
            )
            ELSE cm.user_id
        END as other_user_id,
        CASE 
            WHEN cm.is_self_dm THEN cm.user_name
            WHEN cm.user_id = current_user_id THEN (
                SELECT user_name 
                FROM channel_members cm2
                WHERE cm2.channel_id = cm.channel_id 
                AND cm2.user_id != current_user_id
                LIMIT 1
            )
            ELSE cm.user_name
        END as other_user_name,
        CASE 
            WHEN cm.is_self_dm THEN cm.avatar_url
            WHEN cm.user_id = current_user_id THEN (
                SELECT avatar_url 
                FROM channel_members cm2
                WHERE cm2.channel_id = cm.channel_id 
                AND cm2.user_id != current_user_id
                LIMIT 1
            )
            ELSE cm.avatar_url
        END as other_user_avatar_url,
        cm.is_self_dm
    FROM channel_members cm
    ORDER BY cm.channel_id, 
        CASE WHEN cm.user_id = current_user_id THEN 1 ELSE 0 END,
        cm.user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- migrate:down
DROP FUNCTION IF EXISTS public.create_channel_with_membership(text, text, uuid, boolean);
DROP FUNCTION IF EXISTS public.get_or_create_dm_channel(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_dms(uuid, uuid); 