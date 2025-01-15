import { NextResponse } from 'next/server'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large'
    })

    // Initialize Pinecone client
    const pinecone = new Pinecone()

    const index = pinecone.index(process.env.PINECONE_INDEX_CHAT!)

    // Initialize Pinecone store
    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex: index }
    )

    // Search Pinecone
    const results = await vectorStore.similaritySearch(query, 5)

    // Extract relevant context from results
    const context = results
      .map((doc: Document) => doc.pageContent)
      .join('\n\n')

    // Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant that answers questions about conversations and files in the workspace.
          Use the following context to answer the user's question. If you cannot find the answer in the context,
          say so - do not make up information.
          
          Context:
          ${context}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return NextResponse.json({
      response: completion.choices[0].message.content
    })
  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 