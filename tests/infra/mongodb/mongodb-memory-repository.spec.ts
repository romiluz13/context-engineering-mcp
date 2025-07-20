import { beforeEach, describe, expect, test, vi, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

// Mock the config before importing other modules
let testUri: string;
let mongoServer: MongoMemoryServer;

vi.mock("../../../src/main/config/mongodb-config.js", () => ({
  mongoConfig: {
    get connectionString() { return testUri; },
    databaseName: "test_memory_bank",
    isAtlas: false,
    enableVectorSearch: false,
    voyageApiKey: undefined
  },
  getCollectionNames: () => ({
    memories: "memories",
    projects: "projects"
  })
}));

import { MongoDBConnection } from "../../../src/infra/mongodb/connection/mongodb-connection.js";
import { MongoDBMemoryRepository } from "../../../src/infra/mongodb/repositories/mongodb-memory-repository.js";
import { Memory } from "../../../src/domain/entities/memory.js";

describe("MongoDBMemoryRepository", () => {
  let sut: MongoDBMemoryRepository;
  let connection: MongoDBConnection;

  beforeAll(async () => {
    // Start in-memory MongoDB server for testing
    mongoServer = await MongoMemoryServer.create();
    testUri = mongoServer.getUri();

    // Initialize connection
    connection = MongoDBConnection.getInstance();
    await connection.connect();
  });

  afterAll(async () => {
    await connection.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    sut = new MongoDBMemoryRepository();
    
    // Clean up collections before each test
    const db = await connection.getDatabase();
    await db.collection("memories").deleteMany({});
    await db.collection("projects").deleteMany({});
  });

  describe("store", () => {
    test("should store a memory successfully", async () => {
      const memory: Memory = {
        projectName: "test-project",
        fileName: "test-file.md",
        content: "Test content for memory storage",
        tags: ["test", "memory"],
        lastModified: new Date(),
        wordCount: 5
      };

      const result = await sut.store(memory);

      expect(result).toBeDefined();
      expect(result.projectName).toBe(memory.projectName);
      expect(result.fileName).toBe(memory.fileName);
      expect(result.content).toBe(memory.content);
      expect(result.tags).toEqual(memory.tags);
      expect(result.id).toBeDefined();
    });

    test("should update existing memory when storing with same project and filename", async () => {
      const memory: Memory = {
        projectName: "test-project",
        fileName: "test-file.md",
        content: "Original content",
        tags: ["original"],
        lastModified: new Date(),
        wordCount: 2
      };

      await sut.store(memory);

      const updatedMemory: Memory = {
        ...memory,
        content: "Updated content",
        tags: ["updated"],
        wordCount: 2
      };

      const result = await sut.store(updatedMemory);

      expect(result.content).toBe("Updated content");
      expect(result.tags).toEqual(["updated"]);
    });
  });

  describe("load", () => {
    test("should load existing memory", async () => {
      const memory: Memory = {
        projectName: "test-project",
        fileName: "test-file.md",
        content: "Test content",
        tags: ["test"],
        lastModified: new Date(),
        wordCount: 2
      };

      await sut.store(memory);
      const result = await sut.load("test-project", "test-file.md");

      expect(result).toBeDefined();
      expect(result!.projectName).toBe(memory.projectName);
      expect(result!.fileName).toBe(memory.fileName);
      expect(result!.content).toBe(memory.content);
    });

    test("should return null for non-existing memory", async () => {
      const result = await sut.load("non-existing", "file.md");
      expect(result).toBeNull();
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      // Set up test data
      const memories: Memory[] = [
        {
          projectName: "project1",
          fileName: "auth.md",
          content: "Authentication using JWT tokens",
          tags: ["auth", "security", "jwt"],
          lastModified: new Date(),
          wordCount: 4
        },
        {
          projectName: "project1", 
          fileName: "database.md",
          content: "MongoDB database configuration",
          tags: ["database", "mongodb", "config"],
          lastModified: new Date(),
          wordCount: 3
        },
        {
          projectName: "project2",
          fileName: "api.md", 
          content: "REST API endpoints documentation",
          tags: ["api", "rest", "docs"],
          lastModified: new Date(),
          wordCount: 4
        }
      ];

      for (const memory of memories) {
        await sut.store(memory);
      }
    });

    test("should search memories by text content", async () => {
      const results = await sut.search({
        query: "authentication",
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("auth.md");
      expect(results[0].relevance).toBe("text-match");
    });

    test("should filter by project name", async () => {
      const results = await sut.search({
        query: "mongodb",
        projectName: "project1",
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("database.md");
      expect(results[0].projectName).toBe("project1");
    });

    test("should filter by tags", async () => {
      const results = await sut.search({
        query: "config",
        tags: ["mongodb"],
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("database.md");
    });
  });

  describe("findRelated", () => {
    test("should find related memories based on tags", async () => {
      const memories: Memory[] = [
        {
          projectName: "project1",
          fileName: "auth.md",
          content: "Authentication",
          tags: ["auth", "security"],
          lastModified: new Date(),
          wordCount: 1
        },
        {
          projectName: "project1",
          fileName: "security.md", 
          content: "Security guidelines",
          tags: ["security", "guidelines"],
          lastModified: new Date(),
          wordCount: 2
        },
        {
          projectName: "project1",
          fileName: "unrelated.md",
          content: "Unrelated content", 
          tags: ["other"],
          lastModified: new Date(),
          wordCount: 2
        }
      ];

      for (const memory of memories) {
        await sut.store(memory);
      }

      const results = await sut.findRelated("project1", "auth.md", 5);

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("security.md");
      expect(results[0].relevance).toBe("tag-similarity");
    });
  });

  describe("getProjectStats", () => {
    test("should return project statistics", async () => {
      const memories: Memory[] = [
        {
          projectName: "test-project",
          fileName: "file1.md",
          content: "Content one",
          tags: ["tag1", "tag2"],
          lastModified: new Date(),
          wordCount: 2
        },
        {
          projectName: "test-project",
          fileName: "file2.md",
          content: "Content two with more words",
          tags: ["tag2", "tag3"],
          lastModified: new Date(),
          wordCount: 5
        }
      ];

      for (const memory of memories) {
        await sut.store(memory);
      }

      const stats = await sut.getProjectStats("test-project");

      expect(stats.totalMemories).toBe(2);
      expect(stats.totalWords).toBe(7);
      expect(stats.commonTags).toContain("tag2");
      expect(stats.lastActivity).toBeDefined();
    });
  });
});
