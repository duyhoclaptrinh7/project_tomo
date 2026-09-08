import axios from 'axios';

import { BASE_URL, REQUEST_TIMEOUT_MS } from '../../constants/config.js';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});
