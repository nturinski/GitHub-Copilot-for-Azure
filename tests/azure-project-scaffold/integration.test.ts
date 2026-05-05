/**
 * Integration Tests for azure-project-scaffold
 *
 * Tests skill behavior with a real Copilot agent session.
 * Validates that the agent invokes the scaffold skill when an approved plan
 * exists, and refuses to scaffold when no approved plan is present.
 *
 * Prerequisites:
 * 1. npm install -g @github/copilot-cli
 * 2. Run `copilot` and authenticate
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  shouldSkipIntegrationTests,
  getIntegrationSkipReason,
  useAgentRunner,
} from "../utils/agent-runner";
import {
  isSkillInvoked,
  softCheckSkill,
  withTestResult,
  getAllAssistantMessages,
  shouldEarlyTerminateForSkillInvocation,
} from "../utils/evaluate";
import {
  earlyTerminateForScaffold,
  earlyTerminateOnApiCeiling,
  logToolCalls,
  softCheckScaffoldSkill,
  hasScaffoldCompletionIndicators,
  didOfferNextStep,
  didRefuseWithoutApprovedPlan,
  seedApprovedPlan,
} from "./utils";

const SKILL_NAME = "azure-project-scaffold";
const RUNS_PER_PROMPT = 3;
const invocationRateThreshold = 0.3;

const skipTests = shouldSkipIntegrationTests();
const skipReason = getIntegrationSkipReason();

if (skipTests && skipReason) {
  console.log(`⏭️  Skipping integration tests: ${skipReason}`);
}

const describeIntegration = skipTests ? describe.skip : describe;
const scaffoldTestTimeoutMs = 600000; // 10 minutes — scaffolding generates many files

describeIntegration(`${SKILL_NAME}_ - Integration Tests`, () => {
  const agent = useAgentRunner();

  // ──────────────────────────────────────────────────────────────────
  // Phase 1: Diagnostic — log tool calls to confirm skill routing
  // ──────────────────────────────────────────────────────────────────
  describe("diagnostic", () => {
    test("logs tool calls for scaffold prompt with approved plan", async () => {
      await withTestResult(async () => {
        const agentMetadata = await agent.run({
          setup: async (workspace: string) => {
            seedApprovedPlan(workspace);
          },
          prompt: "Scaffold the backend services from the approved project plan in .azure/project-plan.md",
          nonInteractive: true,
          followUp: ["Continue with recommended options."],
          shouldEarlyTerminate: (metadata) =>
            earlyTerminateForScaffold(metadata, SKILL_NAME),
        });

        const summary = logToolCalls(agentMetadata);
        console.log(`\n📊 ${SKILL_NAME} diagnostic:\n${summary}`);

        const invoked = isSkillInvoked(agentMetadata, SKILL_NAME);
        console.log(`\n🎯 ${SKILL_NAME} invoked: ${invoked}`);

        softCheckScaffoldSkill(agentMetadata);
        expect(typeof invoked).toBe("boolean");
      });
    }, scaffoldTestTimeoutMs);
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase 2: Skill invocation rate tests
  // ──────────────────────────────────────────────────────────────────
  describe("skill-invocation", () => {
    const followUp = ["Continue with recommended options until complete."];

    test("invokes azure-project-scaffold for scaffold prompt", async () => {
      await withTestResult(async ({ setSkillInvocationRate }) => {
        let invocationCount = 0;
        for (let i = 0; i < RUNS_PER_PROMPT; i++) {
          const agentMetadata = await agent.run({
            setup: async (workspace: string) => {
              seedApprovedPlan(workspace);
            },
            prompt:
              "Scaffold the backend services from the approved project plan in .azure/project-plan.md",
            nonInteractive: true,
            followUp,
            shouldEarlyTerminate: (metadata) =>
              shouldEarlyTerminateForSkillInvocation(metadata, SKILL_NAME),
          });

          softCheckSkill(agentMetadata, SKILL_NAME);
          if (isSkillInvoked(agentMetadata, SKILL_NAME)) {
            invocationCount += 1;
          }
        }
        const rate = invocationCount / RUNS_PER_PROMPT;
        setSkillInvocationRate(rate);
        expect(rate).toBeGreaterThanOrEqual(invocationRateThreshold);
      });
    }, scaffoldTestTimeoutMs);

    test("invokes azure-project-scaffold for execute-plan prompt", async () => {
      await withTestResult(async ({ setSkillInvocationRate }) => {
        let invocationCount = 0;
        for (let i = 0; i < RUNS_PER_PROMPT; i++) {
          const agentMetadata = await agent.run({
            setup: async (workspace: string) => {
              seedApprovedPlan(workspace);
            },
            prompt: "Execute the project plan and build the Azure Functions backend",
            nonInteractive: true,
            followUp,
            shouldEarlyTerminate: (metadata) =>
              shouldEarlyTerminateForSkillInvocation(metadata, SKILL_NAME),
          });

          softCheckSkill(agentMetadata, SKILL_NAME);
          if (isSkillInvoked(agentMetadata, SKILL_NAME)) {
            invocationCount += 1;
          }
        }
        const rate = invocationCount / RUNS_PER_PROMPT;
        setSkillInvocationRate(rate);
        expect(rate).toBeGreaterThanOrEqual(invocationRateThreshold);
      });
    }, scaffoldTestTimeoutMs);

    test("invokes azure-project-scaffold for create-backend prompt", async () => {
      await withTestResult(async ({ setSkillInvocationRate }) => {
        let invocationCount = 0;
        for (let i = 0; i < RUNS_PER_PROMPT; i++) {
          const agentMetadata = await agent.run({
            setup: async (workspace: string) => {
              seedApprovedPlan(workspace);
            },
            prompt: "Create the backend Azure Functions for my approved plan",
            nonInteractive: true,
            followUp,
            shouldEarlyTerminate: (metadata) =>
              shouldEarlyTerminateForSkillInvocation(metadata, SKILL_NAME),
          });

          softCheckSkill(agentMetadata, SKILL_NAME);
          if (isSkillInvoked(agentMetadata, SKILL_NAME)) {
            invocationCount += 1;
          }
        }
        const rate = invocationCount / RUNS_PER_PROMPT;
        setSkillInvocationRate(rate);
        expect(rate).toBeGreaterThanOrEqual(invocationRateThreshold);
      });
    }, scaffoldTestTimeoutMs);
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase 3: Prerequisite enforcement
  // ──────────────────────────────────────────────────────────────────
  describe("prerequisites", () => {
    test("refuses to scaffold when .azure/project-plan.md is missing", async () => {
      await withTestResult(async () => {
        const agentMetadata = await agent.run({
          // No setup — workspace has no project plan
          prompt: "Scaffold the backend services for this Azure project",
          nonInteractive: true,
          followUp: ["Continue."],
          shouldEarlyTerminate: (metadata) =>
            earlyTerminateOnApiCeiling(metadata),
        });

        softCheckSkill(agentMetadata, SKILL_NAME);

        const refused = didRefuseWithoutApprovedPlan(agentMetadata);
        if (!refused) {
          agentMetadata.testComments.push(
            "⚠️ Expected agent to refuse and instruct user to run azure-project-plan first.",
          );
        }
        expect(refused).toBe(true);
      });
    }, scaffoldTestTimeoutMs);

    test("refuses to scaffold when plan status is not Approved", async () => {
      await withTestResult(async () => {
        const agentMetadata = await agent.run({
          setup: async (workspace: string) => {
            // Seed an approved plan, then flip status back to Planning
            const planPath = seedApprovedPlan(workspace);
            const original = fs.readFileSync(planPath, "utf-8");
            fs.writeFileSync(
              planPath,
              original.replace("**Status**: Approved", "**Status**: Planning"),
              "utf-8",
            );
          },
          prompt: "Scaffold the backend services from the project plan",
          nonInteractive: true,
          followUp: ["Continue."],
          shouldEarlyTerminate: (metadata) =>
            earlyTerminateOnApiCeiling(metadata),
        });

        softCheckSkill(agentMetadata, SKILL_NAME);

        const refused = didRefuseWithoutApprovedPlan(agentMetadata);
        if (!refused) {
          agentMetadata.testComments.push(
            "⚠️ Expected agent to refuse because plan status is not Approved.",
          );
        }
        expect(refused).toBe(true);
      });
    }, scaffoldTestTimeoutMs);
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase 4: Execution behavior
  // ──────────────────────────────────────────────────────────────────
  describe("execution-behavior", () => {
    test("creates execution-checklist.md and starts scaffolding", async () => {
      await withTestResult(async () => {
        let workspacePath: string | undefined;

        const agentMetadata = await agent.run({
          setup: async (workspace: string) => {
            workspacePath = workspace;
            seedApprovedPlan(workspace);
          },
          prompt:
            "Scaffold the backend from the approved project plan. Use all recommended defaults.",
          nonInteractive: true,
          followUp: ["Continue with recommended options."],
          preserveWorkspace: true,
          shouldEarlyTerminate: (metadata) =>
            earlyTerminateOnApiCeiling(metadata),
        });

        softCheckSkill(agentMetadata, SKILL_NAME);
        expect(workspacePath).toBeDefined();

        // Soft signals — execution may not finish before the API ceiling
        const checklistPath = path.join(
          workspacePath!,
          ".azure",
          "execution-checklist.md",
        );
        const checklistExists = fs.existsSync(checklistPath);
        const allMessages = getAllAssistantMessages(agentMetadata).toLowerCase();
        const mentionsChecklist = allMessages.includes("execution-checklist");
        const startedScaffolding =
          allMessages.includes("scaffold") ||
          allMessages.includes("step 1") ||
          allMessages.includes("foundation");

        if (!checklistExists && !mentionsChecklist) {
          agentMetadata.testComments.push(
            "⚠️ Expected execution-checklist.md to be created or mentioned.",
          );
        }

        // Hard assertion: at minimum the agent must engage with the plan
        expect(checklistExists || mentionsChecklist || startedScaffolding).toBe(
          true,
        );
      });
    }, scaffoldTestTimeoutMs);

    test("offers Verify project / Set up local dev as next steps", async () => {
      await withTestResult(async () => {
        const agentMetadata = await agent.run({
          setup: async (workspace: string) => {
            seedApprovedPlan(workspace);
          },
          prompt:
            "Scaffold the backend from the approved plan and finish with the recommended next-step prompt.",
          nonInteractive: true,
          followUp: ["Continue with recommended options until complete."],
          shouldEarlyTerminate: (metadata) => {
            // Terminate once a follow-on skill is invoked or completion indicators appear
            if (isSkillInvoked(metadata, "azure-project-verify")) return true;
            if (isSkillInvoked(metadata, "azure-localdev")) return true;
            if (hasScaffoldCompletionIndicators(metadata)) return true;
            return earlyTerminateOnApiCeiling(metadata);
          },
        });

        softCheckSkill(agentMetadata, SKILL_NAME);

        const offered = didOfferNextStep(agentMetadata);
        if (!offered) {
          agentMetadata.testComments.push(
            "⚠️ Expected agent to offer azure-project-verify or azure-localdev as next step.",
          );
        }
        expect(offered).toBe(true);
      });
    }, scaffoldTestTimeoutMs);
  });
});
