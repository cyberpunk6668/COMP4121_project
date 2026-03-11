import axios, { AxiosRequestConfig, Method } from 'axios';
import { createCipheriv, createDecipheriv, createSign, createVerify, randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { Order } from '../data/mockData';

const WECHAT_API_BASE_URL = 'https://api.mch.weixin.qq.com';

interface WechatPayConfig {
  enabled: boolean;
  appId: string;
  mchId: string;
  serialNo: string;
  apiV3Key: string;
  privateKeyPath: string;
  privateKey: string;
  notifyUrl: string;
  platformPublicKeyPath: string;
  platformPublicKey: string;
}

interface NativePayResponse {
  code_url: string;
}

interface WechatTransactionQueryResponse {
  trade_state?: string;
  trade_state_desc?: string;
  transaction_id?: string;
  out_trade_no?: string;
  success_time?: string;
}

interface WechatPayNotificationResource {
  algorithm: 'AEAD_AES_256_GCM';
  ciphertext: string;
  associated_data?: string;
  nonce: string;
  original_type: string;
}

interface WechatPayNotification {
  id: string;
  create_time: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: WechatPayNotificationResource;
}

export interface WechatPayNotificationResult {
  outTradeNo: string;
  transactionId?: string;
  successTime?: string;
  tradeState?: string;
}

function getEnv(name: string) {
  return process.env[name]?.trim() ?? '';
}

function resolveKeyFile(filePath: string) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const candidates = [
    path.resolve(process.cwd(), filePath),
    path.resolve(__dirname, '..', '..', filePath),
    path.resolve(__dirname, '..', '..', '..', filePath)
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function readKeyFile(filePath: string, label: string) {
  const resolved = resolveKeyFile(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`${label} file not found: ${resolved}`);
  }
  return readFileSync(resolved, 'utf8');
}

export function getWechatPayReadiness() {
  const enabled = getEnv('WECHAT_PAY_ENABLED') === 'true';
  if (!enabled) {
    return {
      enabled: false,
      configured: false,
      message: 'WeChat Pay is disabled. Set WECHAT_PAY_ENABLED=true to enable it.'
    };
  }

  try {
    getWechatPayConfig();
    return {
      enabled: true,
      configured: true,
      message: 'WeChat Pay is configured.'
    };
  } catch (error) {
    return {
      enabled: true,
      configured: false,
      message: error instanceof Error ? error.message : 'Unknown WeChat Pay configuration error.'
    };
  }
}

function getWechatPayConfig(): WechatPayConfig {
  const enabled = getEnv('WECHAT_PAY_ENABLED') === 'true';
  if (!enabled) {
    throw new Error('WeChat Pay is disabled.');
  }

  const requiredEnvVars = [
    'WECHAT_PAY_APP_ID',
    'WECHAT_PAY_MCH_ID',
    'WECHAT_PAY_SERIAL_NO',
    'WECHAT_PAY_API_V3_KEY',
    'WECHAT_PAY_PRIVATE_KEY_PATH',
    'WECHAT_PAY_NOTIFY_URL',
    'WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH'
  ];

  const missingVars = requiredEnvVars.filter((name) => !getEnv(name));
  if (missingVars.length > 0) {
    throw new Error(`Missing WeChat Pay environment variables: ${missingVars.join(', ')}`);
  }

  const privateKeyPath = getEnv('WECHAT_PAY_PRIVATE_KEY_PATH');
  const platformPublicKeyPath = getEnv('WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH');

  const apiV3Key = getEnv('WECHAT_PAY_API_V3_KEY');
  if (Buffer.byteLength(apiV3Key, 'utf8') !== 32) {
    throw new Error('WECHAT_PAY_API_V3_KEY must be exactly 32 bytes.');
  }

  return {
    enabled,
    appId: getEnv('WECHAT_PAY_APP_ID'),
    mchId: getEnv('WECHAT_PAY_MCH_ID'),
    serialNo: getEnv('WECHAT_PAY_SERIAL_NO'),
    apiV3Key,
    privateKeyPath,
    privateKey: readKeyFile(privateKeyPath, 'WeChat Pay private key'),
    notifyUrl: getEnv('WECHAT_PAY_NOTIFY_URL'),
    platformPublicKeyPath,
    platformPublicKey: readKeyFile(platformPublicKeyPath, 'WeChat Pay platform public key')
  };
}

function generateNonce() {
  return randomBytes(16).toString('hex');
}

function buildAuthorization(method: Method, canonicalPath: string, body: string, config: WechatPayConfig) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const message = `${method.toUpperCase()}\n${canonicalPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const signer = createSign('RSA-SHA256');
  signer.update(message);
  signer.end();
  const signature = signer.sign(config.privateKey, 'base64');

  return {
    timestamp,
    nonce,
    authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`
  };
}

async function requestWechatPay<T>(method: Method, canonicalPath: string, body?: string) {
  const config = getWechatPayConfig();
  const payload = body ?? '';
  const auth = buildAuthorization(method, canonicalPath, payload, config);

  const requestConfig: AxiosRequestConfig = {
    method,
    baseURL: WECHAT_API_BASE_URL,
    url: canonicalPath,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: auth.authorization,
      'Wechatpay-Serial': config.serialNo,
      'User-Agent': 'repair-platform/1.0'
    },
    data: payload || undefined,
    timeout: 15000
  };

  const response = await axios.request<T>(requestConfig);
  return response.data;
}

export async function createNativeWechatPayment(order: Order) {
  const payload = JSON.stringify({
    appid: getEnv('WECHAT_PAY_APP_ID'),
    mchid: getEnv('WECHAT_PAY_MCH_ID'),
    description: `修达达上门维修订单 ${order.orderNo}`,
    out_trade_no: order.orderNo,
    notify_url: getEnv('WECHAT_PAY_NOTIFY_URL'),
    amount: {
      total: Math.round(order.totalAmount * 100),
      currency: 'CNY'
    }
  });

  return requestWechatPay<NativePayResponse>('POST', '/v3/pay/transactions/native', payload);
}

export async function queryWechatPaymentByOrderNo(orderNo: string) {
  const mchId = getEnv('WECHAT_PAY_MCH_ID');
  const canonicalPath = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${encodeURIComponent(mchId)}`;
  return requestWechatPay<WechatTransactionQueryResponse>('GET', canonicalPath);
}

function verifyNotificationSignature(rawBody: string, headers: Record<string, string | string[] | undefined>) {
  const config = getWechatPayConfig();
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];

  if (typeof signature !== 'string' || typeof timestamp !== 'string' || typeof nonce !== 'string') {
    throw new Error('Missing WeChat Pay callback signature headers.');
  }

  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const verifier = createVerify('RSA-SHA256');
  verifier.update(message);
  verifier.end();

  const isVerified = verifier.verify(config.platformPublicKey, signature, 'base64');
  if (!isVerified) {
    throw new Error('Invalid WeChat Pay callback signature.');
  }
}

function decryptNotificationResource(resource: WechatPayNotificationResource) {
  const apiV3Key = Buffer.from(getEnv('WECHAT_PAY_API_V3_KEY'), 'utf8');
  const encrypted = Buffer.from(resource.ciphertext, 'base64');
  const authTag = encrypted.subarray(encrypted.length - 16);
  const cipherText = encrypted.subarray(0, encrypted.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', apiV3Key, Buffer.from(resource.nonce, 'utf8'));
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
  }
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
}

export function parseWechatPayNotification(rawBody: string, headers: Record<string, string | string[] | undefined>): WechatPayNotificationResult {
  verifyNotificationSignature(rawBody, headers);

  const parsedBody = JSON.parse(rawBody) as WechatPayNotification;
  const decrypted = decryptNotificationResource(parsedBody.resource);
  const transaction = JSON.parse(decrypted) as WechatTransactionQueryResponse;

  return {
    outTradeNo: transaction.out_trade_no ?? '',
    transactionId: transaction.transaction_id,
    successTime: transaction.success_time,
    tradeState: transaction.trade_state
  };
}

export function encryptWechatPayResponse(data: Record<string, unknown>) {
  const apiV3Key = Buffer.from(getEnv('WECHAT_PAY_API_V3_KEY'), 'utf8');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', apiV3Key, nonce);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([encrypted, authTag]).toString('base64');
}
