import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as _ from 'lodash'

export default (request: VercelRequest, response: VercelResponse) => {
  const { name } = request.query;
  // there is no problem with any depedencies, e.g., lodash
  _.map(["aaa", "bbb"], (item) => item + "a surfix").forEach( (a) => console.log(a))
  response.status(200).send(`Hello ${name}!`);
};