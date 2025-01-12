-- Add has_reply column
ALTER TABLE messages ADD COLUMN has_reply boolean DEFAULT false;

-- Create function to update has_reply
CREATE OR REPLACE FUNCTION update_message_has_reply()
RETURNS TRIGGER AS $$
BEGIN
    -- When a reply is added, set has_reply to true for the parent message
    IF NEW.parent_message_id IS NOT NULL THEN
        UPDATE messages 
        SET has_reply = true 
        WHERE id = NEW.parent_message_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update has_reply
CREATE TRIGGER message_has_reply_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_has_reply(); 