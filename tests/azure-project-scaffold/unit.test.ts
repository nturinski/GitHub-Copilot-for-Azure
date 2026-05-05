/**
 * Unit Tests for azure-project-scaffold
 *
 * Test isolated skill logic and validation rules.
 */

import { readFileSync, existsSync } from "node:fs";
import * as path from "node:path";
import { loadSkill, LoadedSkill } from "../utils/skill-loader";

const SKILL_NAME = "azure-project-scaffold";

describe(`${SKILL_NAME} - Unit Tests`, () => {
  let skill: LoadedSkill;

  beforeAll(async () => {
    skill = await loadSkill(SKILL_NAME);
  });

  describe("Skill Metadata", () => {
    test("has valid SKILL.md with required fields", () => {
      expect(skill.metadata).toBeDefined();
      expect(skill.metadata.name).toBe(SKILL_NAME);
      expect(skill.metadata.description).toBeDefined();
      expect(skill.metadata.description.length).toBeGreaterThan(10);
    });

    test("description meets Medium-High compliance length", () => {
      expect(skill.metadata.description.length).toBeGreaterThan(150);
      expect(skill.metadata.description.length).toBeLessThanOrEqual(1024);
    });

    test("description contains WHEN trigger phrases", () => {
      expect(skill.metadata.description).toContain("WHEN:");
    });

    test("has license field set to MIT", () => {
      expect(skill.metadata.license).toBe("MIT");
    });

    test("has metadata.author set to Microsoft", () => {
      const meta = skill.metadata.metadata as Record<string, unknown>;
      expect(meta).toBeDefined();
      expect(meta.author).toBe("Microsoft");
    });

    test("has metadata.version in semver format", () => {
      const meta = skill.metadata.metadata as Record<string, unknown>;
      expect(meta.version).toMatch(/^(\d+\.\d+\.\d+|0\.0\.0-placeholder)$/);
    });

    test("description mentions follow-up skills", () => {
      // Scaffold completes by suggesting verification or local dev setup
      const description = skill.metadata.description.toLowerCase();
      expect(description).toMatch(/verif|local dev|follow-up/);
    });

    test("description mentions parallel sub-agents", () => {
      const description = skill.metadata.description.toLowerCase();
      expect(description).toContain("sub-agent");
    });
  });

  describe("Skill Content", () => {
    test("has substantive content", () => {
      expect(skill.content).toBeDefined();
      expect(skill.content.length).toBeGreaterThan(100);
    });

    test("contains expected top-level sections", () => {
      expect(skill.content).toContain("## Triggers");
      expect(skill.content).toContain("## Rules");
      expect(skill.content).toContain("## Outputs");
      expect(skill.content).toContain("## Next");
    });

    test("contains DO NOT Activate When section", () => {
      expect(skill.content).toContain("DO NOT Activate When");
    });

    test("contains Prerequisites section", () => {
      expect(skill.content).toContain("## Prerequisites");
    });

    test("contains Execution Steps section", () => {
      expect(skill.content).toContain("## Execution Steps");
    });

    test("contains Context Management guidance", () => {
      expect(skill.content).toContain("Context Management");
    });

    test("contains Runtime Quick Reference table", () => {
      expect(skill.content).toContain("Runtime Quick Reference");
    });
  });

  describe("Triggers", () => {
    test("lists key activation scenarios in Triggers section", () => {
      const lowerContent = skill.content.toLowerCase();
      expect(lowerContent).toContain("execute approved project plan");
      expect(lowerContent).toContain("scaffold backend");
    });

    test("DO NOT Activate table redirects to correct sibling skills", () => {
      expect(skill.content).toContain("azure-project-plan");
      expect(skill.content).toContain("azure-localdev");
      expect(skill.content).toContain("azure-project-verify");
      expect(skill.content).toContain("azure-prepare");
    });
  });

  describe("Plan-First Workflow", () => {
    test("requires .azure/project-plan.md as input", () => {
      expect(skill.content).toContain(".azure/project-plan.md");
    });

    test("requires plan status Approved before proceeding", () => {
      const lowerContent = skill.content.toLowerCase();
      expect(lowerContent).toContain("approved");
      expect(skill.content).toMatch(/status.*Approved/i);
    });

    test("instructs agent to STOP if plan is missing or not Approved", () => {
      expect(skill.content).toMatch(/STOP/);
      expect(skill.content).toMatch(/run\s+`?azure-project-plan`?\s+first/i);
    });

    test("creates .azure/execution-checklist.md as live tracker", () => {
      expect(skill.content).toContain(".azure/execution-checklist.md");
    });

    test("documents plan status transitions", () => {
      // Approved → In Progress → Scaffolded → Ready
      expect(skill.content).toContain("In Progress");
      expect(skill.content).toContain("Scaffolded");
    });

    test("references vscode_askQuestions tool for follow-up prompt", () => {
      expect(skill.content).toContain("vscode_askQuestions");
    });
  });

  describe("Workflow Steps", () => {
    test("defines Step 0 (Read Plan & Validate)", () => {
      expect(skill.content).toMatch(/STEP 0:.*Read Plan/i);
    });

    test("defines Step 0.5 (Frontend Preview)", () => {
      expect(skill.content).toMatch(/Step 0\.5:.*Frontend Preview/i);
    });

    test("defines Sub-Agent Strategy section", () => {
      expect(skill.content).toMatch(/Sub-Agent Strategy/i);
    });

    test("defines Steps 1 through 12", () => {
      for (const stepNumber of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        expect(skill.content).toMatch(new RegExp(`Step ${stepNumber}:`));
      }
    });

    test("Step 1 covers Foundation", () => {
      expect(skill.content).toMatch(/Step 1:.*Foundation/i);
    });

    test("Step 2 covers Configuration & Environment", () => {
      expect(skill.content).toMatch(/Step 2:.*Configuration.*Environment/i);
    });

    test("Step 3 covers Service Abstraction Layer", () => {
      expect(skill.content).toMatch(/Step 3:.*Service Abstraction/i);
    });

    test("Step 4 covers Database Schema & Migrations", () => {
      expect(skill.content).toMatch(/Step 4:.*Database Schema/i);
    });

    test("Step 5 covers Shared Types & Validation Schemas", () => {
      expect(skill.content).toMatch(/Step 5:.*Shared Types/i);
    });

    test("Step 6 covers API Routes / Functions", () => {
      expect(skill.content).toMatch(/Step 6:.*API Routes/i);
    });

    test("Step 7 covers Error Handling Middleware", () => {
      expect(skill.content).toMatch(/Step 7:.*Error Handling/i);
    });

    test("Step 8 covers Health Check Endpoint", () => {
      expect(skill.content).toMatch(/Step 8:.*Health Check/i);
    });

    test("Step 9 covers OpenAPI / API Contract", () => {
      expect(skill.content).toMatch(/Step 9:.*OpenAPI/i);
    });

    test("Step 10 covers Structured Logging", () => {
      expect(skill.content).toMatch(/Step 10:.*Structured Logging/i);
    });

    test("Step 11 covers Wire Frontend", () => {
      expect(skill.content).toMatch(/Step 11:.*Wire Frontend/i);
    });

    test("Step 12 covers Wrap Up", () => {
      expect(skill.content).toMatch(/Step 12:.*Wrap Up/i);
    });
  });

  describe("Rules", () => {
    test("has the 14 documented core rules", () => {
      const ruleMatches = skill.content.match(/^\d+\.\s+\*\*/gm);
      expect(ruleMatches).not.toBeNull();
      expect(ruleMatches!.length).toBeGreaterThanOrEqual(14);
    });

    test("rule 1 is plan-as-source-of-truth", () => {
      expect(skill.content).toMatch(/1\..*Plan is source of truth/i);
    });

    test("rule 3 is build-gate enforcement", () => {
      expect(skill.content).toMatch(/3\..*Build-gate enforcement/i);
    });

    test("rule 4 is Azure Functions v4 model", () => {
      expect(skill.content).toMatch(/4\..*Azure Functions v4/i);
    });

    test("rule 5 is service abstraction & DI", () => {
      expect(skill.content).toMatch(/5\..*Service abstraction/i);
    });

    test("rule 12 is mandatory func start smoke test", () => {
      expect(skill.content).toMatch(/12\..*func start/i);
    });
  });

  describe("Quality Bars & Checkpoints", () => {
    test("documents auto-init for getServices()", () => {
      expect(skill.content).toContain("getServices()");
      expect(skill.content).toMatch(/auto-initial/i);
    });

    test("documents the func start smoke test as mandatory", () => {
      expect(skill.content).toContain("func start");
      expect(skill.content).toMatch(/mandatory/i);
    });

    test("documents health check status-to-HTTP mapping", () => {
      expect(skill.content).toContain("healthy");
      expect(skill.content).toContain("degraded");
      expect(skill.content).toContain("unhealthy");
      expect(skill.content).toContain("503");
    });

    test("forbids any types in frontend wiring", () => {
      expect(skill.content).toMatch(/no\s+`?any`?\s+types/i);
    });

    test("documents Essential vs Enhancement classification", () => {
      expect(skill.content).toContain("Essential");
      expect(skill.content).toContain("Enhancement");
    });
  });

  describe("Outputs", () => {
    test("Outputs section lists execution checklist artifact", () => {
      expect(skill.content).toContain(".azure/execution-checklist.md");
    });

    test("Outputs section lists backend Functions location", () => {
      expect(skill.content).toMatch(/src\/functions/);
    });

    test("Outputs section lists shared types location", () => {
      expect(skill.content).toMatch(/src\/shared/);
    });
  });

  describe("Next Step Auto-Chain", () => {
    test("references vscode_askQuestions for next-step prompt", () => {
      expect(skill.content).toContain("vscode_askQuestions");
    });

    test("offers Verify project as a recommended next step", () => {
      expect(skill.content).toMatch(/Verify project/i);
      expect(skill.content).toContain("azure-project-verify");
    });

    test("offers Set up local dev as an alternative next step", () => {
      expect(skill.content).toMatch(/Set up local dev/i);
      expect(skill.content).toContain("azure-localdev");
    });

    test("does not auto-suggest deploy or benchmark from Wrap Up", () => {
      // SKILL.md explicitly forbids these as next-step suggestions
      expect(skill.content).toMatch(/Do NOT.*deploy.*benchmark|Do NOT suggest deploy/i);
    });
  });

  describe("Reference Files", () => {
    const referencesDir = path.join(
      global.SKILLS_PATH,
      SKILL_NAME,
      "references"
    );

    test("references/ folder exists", () => {
      expect(existsSync(referencesDir)).toBe(true);
    });

    test.each([
      "frontend-patterns.md",
      "frontend-preview-steps.md",
      "sub-agent-strategy.md",
      "testing.md",
    ])("reference file %s exists on disk", (file) => {
      expect(existsSync(path.join(referencesDir, file))).toBe(true);
    });

    test("SKILL.md links each local reference file", () => {
      expect(skill.content).toContain("references/frontend-patterns.md");
      expect(skill.content).toContain("references/frontend-preview-steps.md");
      expect(skill.content).toContain("references/sub-agent-strategy.md");
    });
  });

  describe("Frontmatter Formatting", () => {
    test("frontmatter has no tabs", () => {
      const raw = readFileSync(skill.filePath, "utf-8");
      const frontmatter = raw.split("---")[1];
      expect(frontmatter).not.toMatch(/\t/);
    });

    test("frontmatter keys are only supported attributes", () => {
      const raw = readFileSync(skill.filePath, "utf-8");
      const frontmatter = raw.split("---")[1];
      const supported = [
        "name",
        "description",
        "compatibility",
        "license",
        "metadata",
        "argument-hint",
        "disable-model-invocation",
        "user-invokable",
      ];
      const keys = frontmatter
        .split("\n")
        .filter((l: string) => /^[a-z][\w-]*\s*:/.test(l))
        .map((l: string) => l.split(":")[0].trim());
      for (const key of keys) {
        expect(supported).toContain(key);
      }
    });

    test("WHEN clause is inside description", () => {
      expect(skill.metadata.description).toContain("WHEN:");
    });

    test("name in frontmatter matches directory name", () => {
      expect(skill.metadata.name).toBe(SKILL_NAME);
    });
  });
});
