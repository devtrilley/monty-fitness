export const getSetLabel = (sets, currentIndex) => {
  const currentSet = sets[currentIndex];
  const setType = currentSet.set_type || currentSet.type || "normal";

  if (setType === "warmup") return "W";
  if (setType === "failure") return "F";
  if (setType === "drop") return "D";

  // Count normal/failure sets up to current index
  let normalSetCount = 0;
  for (let i = 0; i <= currentIndex; i++) {
    const type = sets[i]?.set_type || sets[i]?.type || "normal";
    if (type === "normal" || type === "failure") {
      normalSetCount++;
    }
  }
  return normalSetCount;
};
