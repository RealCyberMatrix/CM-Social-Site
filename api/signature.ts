import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as _ from 'lodash'
import getSignature  from '../src/utils/signature-generator';

export default async (request: VercelRequest, response: VercelResponse) => {
  // creator: the requester to mint
  try {
    const { creator } = request.body;
    const signature = await getSignature(creator);
  
    response.status(200).send({ signature: signature });
  } catch (error) {
    response.status(400).send({ msg: 'Something went wrong' });
  }

};