import _sum from "lodash-es/sum";

export function sum(...numbers) {
  if (numbers.length <= 0) {
    throw new Error();
  }
  return _sum(numbers);
}
