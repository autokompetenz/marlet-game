import axios from 'axios';

const CONSUMER_KEY = process.env.MTN_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MTN_CONSUMER_SECRET;
const SUB_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const ENV = process.env.MTN_ENV || 'sandbox';
const CALLBACK_HOST = process.env.MTN_CALLBACK_HOST || 'https://marlet-game.vercel.app';
const TIMEOUT = 10000;

function baseURL() {
  if (ENV === 'production') return 'https://proxy.momoapi.mtn.com';
  return 'https://sandbox.momodeveloper.mtn.com';
}

async function getToken() {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) throw new Error('MTN non configuré');
  // Consumer Key = API User (UUID), Consumer Secret = API Key
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.post(`${baseURL()}/collection/token/`, {}, {
    timeout: TIMEOUT,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Ocp-Apim-Subscription-Key': SUB_KEY || CONSUMER_KEY,
    },
  });
  return data.access_token;
}

export async function requestPayment(phone, amount, reference) {
  const token = await getToken();
  const { data } = await axios.post(
    `${baseURL()}/collection/v1_0/requesttopay`,
    {
      amount: amount.toString(),
      currency: 'XAF',
      externalId: reference,
      payer: { partyIdType: 'MSISDN', partyId: phone },
      payerMessage: 'Dépôt Marlet Game',
      payeeNote: 'Merci pour votre dépôt',
    },
    {
      timeout: TIMEOUT,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': ENV,
        'Ocp-Apim-Subscription-Key': SUB_KEY || CONSUMER_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}

export async function checkPaymentStatus(reference) {
  const token = await getToken();
  try {
    const { data } = await axios.get(
      `${baseURL()}/collection/v1_0/requesttopay/${reference}`,
      {
        timeout: TIMEOUT,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': ENV,
          'Ocp-Apim-Subscription-Key': SUB_KEY || CONSUMER_KEY,
        },
      }
    );
    return data;
  } catch {
    return { status: 'FAILED' };
  }
}

export async function transfer(phone, amount, reference) {
  const token = await getToken();
  const { data } = await axios.post(
    `${baseURL()}/disbursement/v1_0/transfer`,
    {
      amount: amount.toString(),
      currency: 'XAF',
      externalId: reference,
      payee: { partyIdType: 'MSISDN', partyId: phone },
      payerMessage: 'Retrait Marlet Game',
      payeeNote: 'Votre retrait',
    },
    {
      timeout: TIMEOUT,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': ENV,
        'Ocp-Apim-Subscription-Key': SUB_KEY || CONSUMER_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}
