import { useAuth } from "@clerk/nextjs";

type ToolId = 'resize' | 'crop' | 'adjust' | 'text' | 'background' | 'ai_extender' | 'ai_edit';

export function usePlanAccess() {
  const { has } = useAuth();

  const isPro = has?.({ plan: "pro" }) || false;
  const isFree = !isPro;

  const planAccess: Record<ToolId, boolean> = {
    resize: true,
    crop: true,
    adjust: true,
    text: true,

    background: isPro,
    ai_extender: isPro,
    ai_edit: isPro,
  };

  const hasAccess = (toolId: ToolId) => {
    return planAccess[toolId] === true;
  };

  const getRestrictedTools = () => {
    return Object.entries(planAccess)
      .filter(([, hasAccess]) => !hasAccess)
      .map(([toolId]) => toolId);
  };

  const canCreateProject = (currentProjectCount: number) => {
    if (isPro) return true;
    return currentProjectCount < 3;
  };

  const canExport = (currentExportsThisMonth: number) => {
    if (isPro) return true;
    return currentExportsThisMonth < 20;
  };

  return {
    userPlan: isPro ? "pro" : "free_user",
    isPro,
    isFree,
    hasAccess,
    planAccess,
    getRestrictedTools,
    canCreateProject,
    canExport,
  };
}