import { kebabCase } from "lodash";

export const camelToKebabCase = (str: string) => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};


function main() {
  // Create a large array of objects
  const arr = new Array(10000).fill('Hello World');

  console.time('kebabCase');
  arr.forEach((item) => kebabCase(item));
  console.timeEnd('kebabCase');
  
  console.time('camelToKebab');
  arr.forEach((item) => camelToKebabCase(item).replace(/ /g, '-'));
  console.timeEnd('camelToKebab');

  console.log(kebabCase('Hello World 1'))
  console.log(camelToKebabCase('Hello World 1').replace(/ /g, '-'))
}

main();
