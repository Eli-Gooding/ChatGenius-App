import { NextResponse } from 'next/server'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'
import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import OpenAI from 'openai'

interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

// Initialize OpenAI client for embeddings and chat
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
})

// Initialize ChatOpenAI
const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
})

// Create prompt template
const template = `You are a helpful AI assistant that answers questions about conversations and files in the workspace.
Use the following context to answer the user's question. If you cannot find the answer in the context,
say so - do not make up information.

Context: {context}

Question: {query}

Answer the question based on the context provided. If the context doesn't contain relevant information,
say so rather than making up information.`

const promptTemplate = PromptTemplate.fromTemplate(template)

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    console.log('Received query:', query)

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not configured')
    }
    if (!process.env.PINECONE_INDEX_CHAT) {
      throw new Error('PINECONE_INDEX_CHAT is not configured')
    }

    console.log('Initializing Pinecone store...')
    // Initialize Pinecone store
    const index = pinecone.index(process.env.PINECONE_INDEX_CHAT)
    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex: index }
    )

    console.log('Searching for relevant documents...')
    // Search for relevant documents
    const results = await vectorStore.similaritySearch(query, 5)
    console.log('Found documents:', results.length)

    // Extract context from results
    const context = results
      .map((doc: Document) => doc.pageContent)
      .join('\n\n')
    console.log('Context length:', context.length)

    console.log('Formatting prompt...')
    // Format prompt with context
    const formattedPrompt = await promptTemplate.format({
      query: query,
      context: context || 'No relevant context found.',
    })

    console.log('Getting response from LLM...')
    // Get response from LLM
    const response = await llm.invoke(formattedPrompt)
    console.log('Got response from LLM')

    return NextResponse.json({
      response: response.content,
      context: results.map((doc: Document) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    })
  } catch (error) {
    console.error('AI Assistant API error:', error)
    let errorMessage = 'Failed to process request'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 