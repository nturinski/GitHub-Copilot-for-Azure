import * as fs from "node:fs";
import * as path from "node:path";

import { type AgentMetadata, getAllAssistantMessages } from "../utils/agent-runner";
import {
  softCheckSkill,
  isSkillInvoked,
  shouldEarlyTerminateForSkillInvocation,
  getToolCalls,
  argsString,
} from "../utils/evaluate";

/**
 * Maximum assistant messages before early termination.
 * Scaffold runs are longer than plan runs because of multi-step execution
 * and parallel sub-agents — give them a higher ceiling.
 */
export const MAX_SCAFFOLD_API_CALLS = 12;

/**
 * Early termination that combines skill invocation check with an API call ceiling.
 * Use for skill-invocation rate tests where we just need to know if scaffold was called.
 */
export function earlyTerminateForScaffold(
  metadata: AgentMetadata,
  skillName: string,
): boolean {
  if (shouldEarlyTerminateForSkillInvocation(metadata, skillName)) return true;
  const messageCount = metadata.events.filter(e => e.type === "assistant.message").length;
  return messageCount >= MAX_SCAFFOLD_API_CALLS;
}

/**
 * Early termination that only caps API calls — does NOT terminate on skill invocation.
 * Use for execution-behavior tests where the agent needs to finish writing files.
 */
export function earlyTerminateOnApiCeiling(metadata: AgentMetadata): boolean {
  const messageCount = metadata.events.filter(e => e.type === "assistant.message").length;
  return messageCount >= MAX_SCAFFOLD_API_CALLS;
}

/**
 * Log all tool calls for diagnostic purposes.
 * Returns a summary string for test output.
 */
export function logToolCalls(agentMetadata: AgentMetadata): string {
  const calls = getToolCalls(agentMetadata);
  const summary = calls.map((call) => {
    const args = argsString(call).slice(0, 120);
    return `  ${call.data.toolName}: ${args}`;
  });
  return `Tool calls (${calls.length}):\n${summary.join("\n")}`;
}

/**
 * Soft-check that the scaffold skill was invoked.
 */
export function softCheckScaffoldSkill(agentMetadata: AgentMetadata): void {
  softCheckSkill(agentMetadata, "azure-project-scaffold");
}

/**
 * Check if the scaffold response mentions completion or auto-chain to a follow-on skill.
 */
export function hasScaffoldCompletionIndicators(agentMetadata: AgentMetadata): boolean {
  const content = getAllAssistantMessages(agentMetadata);
  const completionPatterns = [
    /scaffold(ing)? complete/i,
    /execution-checklist\.md/i,
    /azure-project-verify/i,
    /azure-localdev/i,
    /set up local dev/i,
    /verify project/i,
  ];
  return completionPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check whether the agent suggested or invoked one of the documented follow-on skills.
 */
export function didOfferNextStep(agentMetadata: AgentMetadata): boolean {
  if (
    isSkillInvoked(agentMetadata, "azure-project-verify") ||
    isSkillInvoked(agentMetadata, "azure-localdev")
  ) {
    return true;
  }
  const content = getAllAssistantMessages(agentMetadata);
  return /azure-project-verify|azure-localdev|verify project|set up local dev/i.test(content);
}

/**
 * Check whether the agent refused to proceed because the project plan was missing
 * or not Approved. Used to validate the prerequisites guard.
 */
export function didRefuseWithoutApprovedPlan(agentMetadata: AgentMetadata): boolean {
  const content = getAllAssistantMessages(agentMetadata);
  return /no\s+approved\s+project\s+plan|run\s+`?azure-project-plan`?\s+first|project-plan\.md.*missing|status.*not.*approved/i.test(
    content,
  );
}

/**
 * Seed an approved project plan (.azure/project-plan.md) into a workspace
 * so the scaffold skill's prerequisites pass. Returns the absolute plan path.
 *
 * Reads the fixture from `tests/azure-project-scaffold/fixtures/sample-approved-plan.md`
 * and writes it to `<workspace>/.azure/project-plan.md`.
 */
export function seedApprovedPlan(workspace: string): string {
  const fixture = path.resolve(
    global.TESTS_PATH,
    "azure-project-scaffold",
    "fixtures",
    "sample-approved-plan.md",
  );
  const planContent = fs.readFileSync(fixture, "utf-8");
  const azureDir = path.join(workspace, ".azure");
  fs.mkdirSync(azureDir, { recursive: true });
  const planPath = path.join(azureDir, "project-plan.md");
  fs.writeFileSync(planPath, planContent, "utf-8");
  return planPath;
}
