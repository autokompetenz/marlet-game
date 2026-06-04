import axios from 'axios';

const API_KEY = process.env.MTN_API_KEY;
const API_USER = process.env.MTN_API_USER;
const SUB_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const ENV = process.env.MTN_ENV || 'sandbox';

function baseURL() {
  if (ENV === 'production') return 'https://proxy.momoapi.mtn.com';
  return 'https://sandbox.momodeveloper.mtn.com';
}

async function getToken() {
  const auth = Buffer.from(`${API_USER}:${API_KEY}`).toString('base64');
  const { data } = await axios.post(`${baseURL()}/collection/token/`, {}, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
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
      payerMessage: 'Dépôt casino',
      payeeNote: 'Merci pour votre dépôt',
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': ENV,
        'Ocp-Apim-Subscription-Key': SUB_KEY,
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': ENV,
          'Ocp-Apim-Subscription-Key': SUB_KEY,
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
      payerMessage: 'Retrait casino',
      payeeNote: 'Votre retrait',
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': reference,
        'X-Target-Environment': ENV,
        'Ocp-Apim-Subscription-Key': SUB_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}
