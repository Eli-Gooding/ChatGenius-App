import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Set LangChain to use background callbacks for better performance
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { content, channelId, parentMessageId } = await request.json();

    // Verify user session
    const sessionResult = await supabase.auth.getSession();
    console.log('[Auth] Session check result:', {
      hasSession: !!sessionResult.data.session,
      error: sessionResult.error
    });

    if (sessionResult.error) {
      console.error('[Auth] Session error:', sessionResult.error);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    const session = sessionResult.data.session;
    if (!session) {
      console.error('[Auth] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert message into Supabase
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: session.user.id,
        content: content,
        parent_message_id: parentMessageId
      })
      .select('*, users!inner(user_name), channels!inner(channel_name)')
      .single();

    if (messageError) {
      console.error('[DB] Message insert error:', messageError);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    // If this is a reply, update parent message has_reply flag
    if (parentMessageId) {
      await supabase
        .from('messages')
        .update({ has_reply: true })
        .eq('id', parentMessageId);
    }

    // Create embedding and store in Pinecone
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-large"
    });

    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    const index = pinecone.index(process.env.PINECONE_INDEX_CHAT!);

    // Create metadata for the message
    const metadata = {
      content: messageData.content,
      username: messageData.users.user_name,
      channelName: messageData.channels.channel_name,
      timestamp: messageData.created_at,
      messageId: messageData.id,
      isReply: !!parentMessageId,
      parentMessageId: parentMessageId || ''
    };

    // Get embedding for the message content
    console.log('Getting embedding...');
    const embedding = await embeddings.embedQuery(content);

    // Store in Pinecone
    console.log('Storing in Pinecone with metadata:', metadata);
    await index.upsert([{
      id: messageData.id,
      values: embedding,
      metadata
    }]);

    return NextResponse.json(messageData);
  } catch (error) {
    console.error('[API] Critical error in message creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 