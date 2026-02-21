interface InseeSourceBadgeProps {
  source: "manual" | "auto";
}

export function InseeSourceBadge({ source }: InseeSourceBadgeProps) {
  if (source === "auto") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Auto
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
      Manuel
    </span>
  );
}
