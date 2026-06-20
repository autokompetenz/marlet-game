import axios from 'axios';

const API_KEY = process.env.FEDAPAY_API_KEY;
const ENV = process.env.FEDAPAY_ENV || 'sandbox';

function baseURL() {
  if (ENV === 'live') return 'https://api.fedapay.com/v1';
  return 'https://sandbox-api.fedapay.com/v1';
}

function headers() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function createTransaction({ amount, description, customer, callbackUrl }) {
  const body = {
    description,
    amount,
    currency: { iso: 'XOF' },
    customer: {
      firstname: customer.firstname || customer.lastname || 'Utilisateur',
      lastname: customer.lastname || customer.firstname || 'Marlet',
      email: customer.email || 'client@marletgame.com',
      phone_number: {
        number: customer.phone?.replace(/[^0-9]/g, '') || '97000000',
        country: 'bj',
      },
    },
  };
  if (callbackUrl) body.callback_url = callbackUrl;

  const { data } = await axios.post(`${baseURL()}/transactions`, body, {
    timeout: 10000,
    headers: headers(),
  });
  return data;
}

export async function getTransactionToken(transactionId) {
  const { data } = await axios.post(
    `${baseURL()}/transactions/${transactionId}/token`,
    {},
    { timeout: 10000, headers: headers() }
  );
  return data;
}

export async function getTransaction(transactionId) {
  const { data } = await axios.get(
    `${baseURL()}/transactions/${transactionId}`,
    { timeout: 10000, headers: headers() }
  );
  return data;
}

export async function createTransfer({ amount, phone, description, customerName }) {
  const body = {
    amount,
    currency: { iso: 'XOF' },
    description: description || 'Retrait Marlet Game',
    receiver: {
      name: customerName || 'Utilisateur Marlet',
      phone_number: phone?.replace(/[^0-9+]/g, ''),
      provider: 'mtn',
    },
  };

  const { data } = await axios.post(`${baseURL()}/transfers`, body, {
    timeout: 10000,
    headers: headers(),
  });
  return data;
}
