import type { VercelRequest, VercelResponse } from '@vercel/node';
import getTokenDetails  from '../src/utils/rds-utils';

export default (request: VercelRequest, response: VercelResponse) => {
  // TODO: Add auth check
  try {
    const { tokenIds } = request.body;
    const result = getTokenDetails(tokenIds, (error, results) => {
      if (error) {
        response.status(400).send('Something went wrong');
        return;
      }
      response.status(200).send(results);
    });

  } catch (error) {
    response.status(400).send('Something went wrong');
  }

};