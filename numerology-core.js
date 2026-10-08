export const reduce22 = (value) => {
  let result = Math.abs(Math.trunc(value));
  while (result > 22) result = String(result).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return result || 22;
};

export const reduce9 = (value) => {
  let result = Math.abs(Math.trunc(value));
  while (result > 9) result = String(result).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return result || 9;
};

export const parseBirthDate = (value) => {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;

  const [, dayString, monthString, yearString] = match;
  const day = Number(dayString);
  const month = Number(monthString);
  const year = Number(yearString);
  const today = new Date();
  const date = new Date(year, month - 1, day);

  if (year < 1900 || year > today.getFullYear() || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { day, month, year };
};

export const calculateMatrix = ({ day, month, year }) => {
  const left = reduce22(day);
  const top = month;
  const right = reduce22(String(year).split("").reduce((sum, digit) => sum + Number(digit), 0));
  const bottom = reduce22(left + top + right);
  const center = reduce22(left + top + right + bottom);
  const corners = {
    topLeft: reduce22(left + top),
    topRight: reduce22(top + right),
    bottomRight: reduce22(right + bottom),
    bottomLeft: reduce22(bottom + left)
  };
  const spoke = (base) => {
    const near = reduce22(base + center);
    return { outer: reduce22(base + near), near, core: reduce22(near + center) };
  };
  const diagonal = (corner) => {
    const near = reduce22(corner + center);
    return { outer: reduce22(corner + near), near };
  };
  const tailFirst = reduce22(center + bottom);

  return {
    top,
    right,
    bottom,
    left,
    center,
    corners,
    topSpoke: spoke(top),
    leftSpoke: spoke(left),
    rightSpoke: spoke(right),
    diagonals: {
      topLeft: diagonal(corners.topLeft),
      topRight: diagonal(corners.topRight),
      bottomRight: diagonal(corners.bottomRight),
      bottomLeft: diagonal(corners.bottomLeft)
    },
    tail: { first: tailFirst, second: reduce22(bottom + tailFirst) }
  };
};

export const calculatePersonalYear = ({ day, month }, targetYear = new Date().getFullYear()) => {
  const yearSum = String(targetYear).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return reduce9(day + month + yearSum);
};
