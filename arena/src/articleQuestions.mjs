export const reviewFields = [
  "source_checked",
  "visibility_checked",
  "question_checked",
];

export function questionPreview(set, question) {
  const facts = new Map(set.facts.map((fact) => [fact.id, fact]));
  const selected = question.visible_fact_ids.map(
    (id) => facts.get(id)?.text || "",
  );
  return {
    facts: [question.context, ...selected].filter(Boolean).join("\n\n"),
    task: `${set.task_prefix}\n\n${question.question}`,
  };
}

export function questionCounts(set) {
  const confirmed = set.confirmed_cases || {};
  const selected = set.questions.filter((q) => q.include && !confirmed[q.id]);
  return {
    total: set.questions.length,
    selected: selected.length,
    reviewed: selected.filter((q) =>
      reviewFields.every((key) => q.review?.[key]),
    ).length,
    confirmed: Object.keys(confirmed).length,
  };
}

export function editedQuestion(question, key, value) {
  return {
    ...question,
    [key]: value,
    ...(key === "include"
      ? {}
      : {
          review: Object.fromEntries(reviewFields.map((key) => [key, false])),
        }),
  };
}

export function questionPayload(set) {
  const fields = [
    "id",
    "title",
    "question",
    "decision_point",
    "context",
    "reference_answer",
    "visibility_note",
    "task_type",
    "answer_basis",
    "visible_fact_ids",
    "reference_fact_ids",
    "include",
    "review",
  ];
  return {
    revision: set.revision,
    questions: set.questions.map((question) =>
      Object.fromEntries(fields.map((key) => [key, question[key]])),
    ),
  };
}
