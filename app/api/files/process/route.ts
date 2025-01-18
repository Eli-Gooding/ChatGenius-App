import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { Document } from '@langchain/core/documents';

// Set LangChain to use background callbacks for better performance
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { fileId } = await request.json();

    // Verify user session
    const sessionResult = await supabase.auth.getSession();
    if (sessionResult.error || !sessionResult.data.session) {
      console.error('[Auth] Session error:', sessionResult.error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file metadata from database
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select(`
        *,
        channels!inner(channel_name),
        users!inner(user_name)
      `)
      .eq('id', fileId)
      .single();

    if (fileError || !fileData) {
      console.error('[DB] File fetch error:', fileError);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Download file from storage for processing
    const { data: fileContent, error: downloadError } = await supabase.storage
      .from('channel-files')
      .download(fileData.storage_path);

    if (downloadError || !fileContent) {
      console.error('[Storage] File download error:', downloadError);
      return NextResponse.json({ error: 'File download failed' }, { status: 500 });
    }

    // Process PDF content
    const buffer = await fileContent.arrayBuffer();
    const loader = new WebPDFLoader(new Blob([buffer]));
    const rawDocs = await loader.load();

    // Split documents into smaller chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100
    });
    const documents = await textSplitter.splitDocuments(rawDocs);

    // Initialize embedding model and Pinecone
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-large"
    });

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });

    const index = pinecone.index(process.env.PINECONE_INDEX_CHAT!);

    // Process each chunk and store in Pinecone
    const vectors = await Promise.all(documents.map(async (doc: Document, i: number) => {
      const embedding = await embeddings.embedQuery(doc.pageContent);
      
      return {
        id: `${fileData.id}-chunk-${i}`,
        values: embedding,
        metadata: {
          content: doc.pageContent,
          fileName: fileData.file_name,
          fileId: fileData.id,
          channelName: fileData.channels.channel_name,
          channelId: fileData.channel_id,
          username: fileData.users.user_name,
          userId: fileData.user_id,
          timestamp: fileData.created_at,
          pageNumber: doc.metadata.loc?.pageNumber || null,
          chunkIndex: i
        }
      };
    }));

    // Store vectors in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }

    return NextResponse.json({ 
      success: true,
      chunksProcessed: vectors.length
    });

  } catch (error) {
    console.error('[API] Critical error in PDF processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 