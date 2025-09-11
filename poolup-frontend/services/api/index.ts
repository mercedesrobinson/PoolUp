// Barrel that composes the typed api from domain modules
import { auth } from './auth';
import { users } from './users';
import { pools } from './pools';
import { messages as msgs } from './messages';
import { payments } from './payments';
import { cards } from './cards';
import { social } from './social';
import { privacy } from './privacy';
import { analytics } from './analytics';
import { peers } from './peers';
import { misc } from './misc';

export const api = {
  // auth
  ...auth,
  // user profile/settings
  ...users,
  // pools & members
  ...pools,
  // chat/messages
  ...msgs,
  // payments & recurring
  ...payments,
  // debit/virtual card
  ...cards,
  // social & friends
  ...social,
  // privacy & profile photo
  ...privacy,
  // analytics & summaries
  ...analytics,
  // peer transfer
  ...peers,
  // misc
  ...misc,
};

export type Api = typeof api;

