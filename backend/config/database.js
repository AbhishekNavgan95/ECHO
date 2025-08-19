import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/community/vectorstores/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'quickstart';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

const EMBEDDING_DIMS = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
};

if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is required');

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: EMBEDDING_MODEL,
});

async function ensurePineconeIndex(name, dimension) {
  const indexes = await pc.listIndexes();
  const exists = indexes.indexes?.some((i) => i.name === name);
  if (!exists) {
    console.log(`[pinecone] creating index ${name} (dim ${dimension})...`);
    await pc.createIndex({
      name,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: process.env.PINECONE_CLOUD || 'aws',
          region: process.env.PINECONE_REGION || 'us-east-1',
        },
      },
    });
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const d = await pc.describeIndex(name);
      if (d.status?.ready) { ready = true; break; }
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!ready) throw new Error('Pinecone index not ready yet. Try again later.');
    console.log('[pinecone] index ready.');
  } else {
    const d = await pc.describeIndex(name);
    const existingDim = d.dimension || d.spec?.serverless?.dimension;
    if (existingDim && existingDim !== dimension) {
      throw new Error(`Pinecone index "${name}" has dimension ${existingDim}, but required ${dimension}.`);
    }
  }
}

async function getVectorStore(namespace) {
  await ensurePineconeIndex(PINECONE_INDEX, EMBEDDING_DIMS[EMBEDDING_MODEL]);
  const pineconeIndex = pc.index(PINECONE_INDEX);
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace,
  });
}

export { getVectorStore, embeddings, EMBEDDING_DIMS, EMBEDDING_MODEL };
