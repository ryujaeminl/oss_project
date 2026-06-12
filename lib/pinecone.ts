import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "placeholder_key",
});

const LOCAL_DB_PATH = path.join(process.cwd(), "local_db.json");

function readLocalDb() {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      return {};
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Local DB read error:", e);
    return {};
  }
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Local DB write error:", e);
  }
}

const pc =
  process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== "placeholder_key"
    ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    : null;

export async function getEmbedding(text: string): Promise<number[]> {
  const DIMENSION = 1024;
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "placeholder_key") {
    // Return a dummy 1024-dimensional vector
    return new Array(DIMENSION).fill(0).map(() => Math.random());
  }
  try {
    const result = (await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    })) as any;
    let values = result.embeddings?.[0]?.values || result.embedding?.values || [];
    
    // Adjust dimension to match 1024
    if (values.length < DIMENSION) {
      values = [...values, ...new Array(DIMENSION - values.length).fill(0)];
    } else if (values.length > DIMENSION) {
      values = values.slice(0, DIMENSION);
    }
    return values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return new Array(DIMENSION).fill(0);
  }
}

export async function upsertStudyRecord(
  userId: string,
  recordId: string,
  text: string,
  metadata: Record<string, any>
) {
  const id = `${userId}_${recordId}`;
  const recordData = {
    userId,
    text,
    ...metadata,
    timestamp: new Date().toISOString(),
  };

  if (!pc) {
    const db = readLocalDb();
    if (!db.study_records) {
      db.study_records = [];
    }
    // Remove if duplicate id exists
    db.study_records = db.study_records.filter((r: any) => r.id !== id);
    db.study_records.push({
      id,
      userId,
      text,
      metadata: recordData,
    });
    writeLocalDb(db);
    return;
  }
  try {
    const embedding = await getEmbedding(text);
    const indexName = process.env.PINECONE_INDEX_NAME || "study-planner-index";
    const host = process.env.PINECONE_HOST;
    const index = host ? pc.index(indexName, host) : pc.index(indexName);
    
    await index.upsert({
      records: [
        {
          id,
          values: embedding,
          metadata: recordData,
        },
      ]
    });
  } catch (error) {
    console.error("Pinecone upsert error:", error);
  }
}

export async function queryStudyRecords(userId: string, queryText: string, limit = 5) {
  if (!pc) {
    const db = readLocalDb();
    const records = db.study_records || [];
    
    // Fallback: simple case-insensitive text search on userId match
    const matches = records.filter((r: any) => {
      const isUser = r.userId === userId;
      if (!isUser) return false;
      
      const term = queryText.toLowerCase();
      const textMatch = r.text.toLowerCase().includes(term);
      const metaMatch = r.metadata && Object.values(r.metadata).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(term)
      );
      
      return textMatch || metaMatch;
    });

    // Sort by timestamp descending
    matches.sort((a: any, b: any) => {
      const timeA = new Date(a.metadata?.timestamp || 0).getTime();
      const timeB = new Date(b.metadata?.timestamp || 0).getTime();
      return timeB - timeA;
    });

    return matches.slice(0, limit).map((m: any) => m.metadata) || [];
  }
  try {
    const embedding = await getEmbedding(queryText);
    const indexName = process.env.PINECONE_INDEX_NAME || "study-planner-index";
    const host = process.env.PINECONE_HOST;
    const index = host ? pc.index(indexName, host) : pc.index(indexName);

    const response = await index.query({
      vector: embedding,
      topK: limit,
      filter: { userId: { $eq: userId } },
      includeMetadata: true,
    });
    
    return response.matches.map((m) => m.metadata) || [];
  } catch (error) {
    console.error("Pinecone query error:", error);
    return [];
  }
}

export async function findUserByEmail(email: string) {
  const emailClean = email.toLowerCase().trim();
  if (!pc) {
    const db = readLocalDb();
    const id = `user_${Buffer.from(emailClean).toString("hex")}`;
    if (db[id]) {
      const user = db[id];
      return {
        id,
        ...user,
        tasks: typeof user.tasks === "string" ? JSON.parse(user.tasks) : (user.tasks || []),
      };
    }
    return null;
  }
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || "study-planner-index";
    const host = process.env.PINECONE_HOST;
    const index = host ? pc.index(indexName, host) : pc.index(indexName);
    const emailClean = email.toLowerCase().trim();
    // hex encode to avoid special characters in document ID
    const id = `user_${Buffer.from(emailClean).toString("hex")}`;
    const fetchResult = await index.fetch({ ids: [id] });
    
    if (fetchResult.records && fetchResult.records[id]) {
      const record = fetchResult.records[id];
      const metadata = record.metadata ? { ...record.metadata } : {} as any;
      if (typeof metadata.tasks === "string") {
        try {
          metadata.tasks = JSON.parse(metadata.tasks);
        } catch (e) {
          metadata.tasks = [];
        }
      }
      return {
        id: record.id,
        ...metadata,
      } as any;
    }
    
    // Fallback: Query by filter in case we can't find by ID
    const queryResult = await index.query({
      vector: new Array(1024).fill(0.1),
      filter: { type: { $eq: "user" }, email: { $eq: emailClean } },
      topK: 1,
      includeMetadata: true,
    });
    
    if (queryResult.matches && queryResult.matches.length > 0) {
      const match = queryResult.matches[0];
      const metadata = match.metadata ? { ...match.metadata } : {} as any;
      if (typeof metadata.tasks === "string") {
        try {
          metadata.tasks = JSON.parse(metadata.tasks);
        } catch (e) {
          metadata.tasks = [];
        }
      }
      return {
        id: match.id,
        ...metadata,
      } as any;
    }
    
    return null;
  } catch (error) {
    console.error("findUserByEmail error:", error);
    return null;
  }
}

export async function createUser(data: { email: string; name?: string; password?: string; image?: string; goalTime?: number }) {
  const emailClean = data.email.toLowerCase().trim();
  const id = `user_${Buffer.from(emailClean).toString("hex")}`;
  
  const metadata = {
    type: "user",
    email: emailClean,
    name: data.name || "학습자",
    hashedPassword: data.password || "",
    image: data.image || "",
    goalTime: data.goalTime !== undefined ? Number(data.goalTime) : 120,
    geminiApiKey: "",
    characterName: "올리니",
    characterImage: "",
    tasks: "[]",
    createdAt: new Date().toISOString(),
  };

  if (!pc) {
    const db = readLocalDb();
    db[id] = metadata;
    writeLocalDb(db);
    return {
      id,
      ...metadata,
      tasks: [],
    };
  }

  const indexName = process.env.PINECONE_INDEX_NAME || "study-planner-index";
  const host = process.env.PINECONE_HOST;
  const index = host ? pc.index(indexName, host) : pc.index(indexName);

  await index.upsert({
    records: [
      {
        id,
        values: new Array(1024).fill(0.1),
        metadata,
      }
    ]
  });

  return {
    id,
    ...metadata,
    tasks: [],
  };
}

export async function updateUser(id: string, data: Record<string, any>) {
  const cleanData = { ...data };
  
  // Stringify tasks array to JSON string for Pinecone
  if (cleanData.tasks !== undefined && Array.isArray(cleanData.tasks)) {
    cleanData.tasks = JSON.stringify(cleanData.tasks);
  }

  Object.keys(cleanData).forEach((key) => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });

  if (!pc) {
    const db = readLocalDb();
    if (!db[id]) {
      throw new Error("User not found in local DB");
    }
    const updatedMetadata = {
      ...db[id],
      ...cleanData,
    };
    db[id] = updatedMetadata;
    writeLocalDb(db);

    const returnedMetadata = { ...updatedMetadata };
    if (typeof returnedMetadata.tasks === "string") {
      try {
        returnedMetadata.tasks = JSON.parse(returnedMetadata.tasks);
      } catch {
        returnedMetadata.tasks = [];
      }
    }

    return {
      id,
      ...returnedMetadata,
    };
  }

  const indexName = process.env.PINECONE_INDEX_NAME || "study-planner-index";
  const host = process.env.PINECONE_HOST;
  const index = host ? pc.index(indexName, host) : pc.index(indexName);

  const fetchResult = await index.fetch({ ids: [id] });
  if (!fetchResult.records || !fetchResult.records[id]) {
    throw new Error("User not found in Pinecone");
  }

  const existingMetadata = fetchResult.records[id].metadata || {};

  const updatedMetadata = {
    ...existingMetadata,
    ...cleanData,
  };

  await index.upsert({
    records: [
      {
        id,
        values: new Array(1024).fill(0.1),
        metadata: updatedMetadata as any,
      }
    ]
  });

  const returnedMetadata = { ...updatedMetadata };
  if (typeof returnedMetadata.tasks === "string") {
    try {
      returnedMetadata.tasks = JSON.parse(returnedMetadata.tasks);
    } catch {
      returnedMetadata.tasks = [];
    }
  }

  return {
    id,
    ...returnedMetadata,
  };
}

