// Current aggregate indexes call numerical assessments "complete". Older
// snapshots call them "scored". These are aliases, not counts to add together.
export function numericalRatingCount(index) {
  for (const key of ["complete", "scored"]) {
    const value = index?.item_statuses?.[key];
    if (Number.isSafeInteger(value) && value >= 0) return value;
  }
  return null;
}

export function FullReviewSummary({index, earlierCaseCount, complexCaseCount}) {
  const numerical = numericalRatingCount(index);
  const answers = Number.isSafeInteger(index?.complete_answers) && index.complete_answers >= 0
    ? index.complete_answers : "the available";
  return <p>This review covers the earlier {earlierCaseCount} cases only. All 22 items were checked for {answers} saved answers.
    {numerical === null
      ? " The numerical rating count is not recorded in this saved index."
      : ` ${numerical.toLocaleString("en-GB")} numerical ratings.`}
    {" "}Every unscored item has a reason. The {complexCaseCount} new complex BMJ cases have a separate comparison.
  </p>;
}
