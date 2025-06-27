import { describe, it, expect } from "vitest";
import { AVATARS, getAvatarsForEnvironment } from "../../shared/schema";
import type { Avatar } from "../../shared/schema";

describe("Avatar Selection", () => {
  describe("Avatar Data Validation", () => {
    it("should have exactly 4 avatars defined", () => {
      expect(AVATARS).toHaveLength(4);
    });

    it("should have all required properties for each avatar", () => {
      AVATARS.forEach((avatar, index) => {
        expect(avatar).toHaveProperty("name");
        expect(avatar).toHaveProperty("description");
        expect(avatar).toHaveProperty("agent_id");
        
        expect(typeof avatar.name).toBe("string");
        expect(typeof avatar.description).toBe("string");
        expect(typeof avatar.agent_id).toBe("string");
        
        expect(avatar.name.length).toBeGreaterThan(0);
        expect(avatar.description.length).toBeGreaterThan(0);
        expect(avatar.agent_id.length).toBeGreaterThan(0);
      });
    });

    it("should have unique agent_ids for each avatar", () => {
      const agentIds = AVATARS.map(avatar => avatar.agent_id);
      const uniqueAgentIds = new Set(agentIds);
      expect(uniqueAgentIds.size).toBe(AVATARS.length);
    });

    it("should have unique names for each avatar", () => {
      const names = AVATARS.map(avatar => avatar.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(AVATARS.length);
    });

    it("should have valid ElevenLabs agent_id format", () => {
      AVATARS.forEach(avatar => {
        expect(avatar.agent_id).toMatch(/^agent_[a-z0-9]{26}$/);
      });
    });
  });

  describe("Avatar Content Validation", () => {
    it("should have expected avatar names", () => {
      const expectedNames = ["Jessie", "Shawn", "Maya", "Sam"];
      const actualNames = AVATARS.map(avatar => avatar.name);
      expect(actualNames).toEqual(expectedNames);
    });

    it("should have contextual descriptions", () => {
      AVATARS.forEach(avatar => {
        expect(avatar.description).toMatch(/\w+/); // Contains words
        expect(avatar.description.length).toBeLessThan(50); // Reasonable length
      });
    });
  });

  describe("Avatar Selection Logic", () => {
    it("should find avatar by agent_id", () => {
      const targetAgentId = AVATARS[0].agent_id;
      const foundAvatar = AVATARS.find(avatar => avatar.agent_id === targetAgentId);
      expect(foundAvatar).toBeDefined();
      expect(foundAvatar?.agent_id).toBe(targetAgentId);
    });

    it("should find avatar by name", () => {
      const targetName = AVATARS[1].name;
      const foundAvatar = AVATARS.find(avatar => avatar.name === targetName);
      expect(foundAvatar).toBeDefined();
      expect(foundAvatar?.name).toBe(targetName);
    });

    it("should return undefined for non-existent agent_id", () => {
      const foundAvatar = AVATARS.find(avatar => avatar.agent_id === "invalid_id");
      expect(foundAvatar).toBeUndefined();
    });
  });

  describe("Avatar Integration Requirements", () => {
    it("should have Jessie as default first avatar", () => {
      expect(AVATARS[0].name).toBe("Jessie");
      expect(AVATARS[0].description).toBe("Your local cafe barista");
    });

    it("should match expected agent_ids for current environment", () => {
      // Get the current environment from NODE_ENV
      const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      
      const developmentAgentIds = [
        "agent_01jyfb9fh8f67agfzvv09tvg3t", // Jessie
        "agent_01jypzmj9heh3rhmn47anjbsr8", // Shawn
        "agent_01jyq00m9aev8rq8e6a040rjmv", // Maya
        "agent_01jyq0j92gfxdrv3me49xygae1"  // Sam
      ];
      
      const productionAgentIds = [
        "agent_01jys1g9ndfcqthwrs8p9fy4bn", // Jessie
        "agent_01jys1h6dfe0dt1x186wkqcnmb", // Shawn
        "agent_01jys1jsmje7wvb6vak1dt4t54", // Maya
        "agent_01jys1hz8zf9crk3j8aq7hnk9b"  // Sam
      ];
      
      const expectedAgentIds = environment === 'production' ? productionAgentIds : developmentAgentIds;
      const actualAgentIds = AVATARS.map(avatar => avatar.agent_id);
      
      expect(actualAgentIds).toEqual(expectedAgentIds);
      
      // Also test that we can get avatars for specific environments
      expect(getAvatarsForEnvironment('development').map(a => a.agent_id)).toEqual(developmentAgentIds);
      expect(getAvatarsForEnvironment('production').map(a => a.agent_id)).toEqual(productionAgentIds);
    });
  });

  describe("Avatar Type Safety", () => {
    it("should conform to Avatar type interface", () => {
      AVATARS.forEach((avatar: Avatar) => {
        // TypeScript compilation validates the type structure
        expect(typeof avatar.name).toBe("string");
        expect(typeof avatar.description).toBe("string");
        expect(typeof avatar.agent_id).toBe("string");
      });
    });
  });
});