import dns from 'dns';
import { URL } from 'url';

export interface UrlSecurityResult {
  safe: boolean;
  errorCode?: 'INVALID_URL' | 'BLOCKED_URL';
  errorMessage?: string;
  normalizedUrl?: string;
  hostname?: string;
  resolvedIp?: string;
}

/**
 * Checks whether an IPv4 string belongs to private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed -> consider unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure cloud metadata)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24, 192.0.2.0/24 (Documentation / Test-Net-1)
  if (a === 192 && b === 0) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Network benchmark tests)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (Test-Net-2)
  if (a === 198 && b === 51) return true;

  // 203.0.113.0/24 (Test-Net-3)
  if (a === 203 && b === 0) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks whether an IPv6 string belongs to private, loopback, or link-local ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const cleanIp = ip.toLowerCase();

  // Loopback (::1)
  if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1') return true;

  // Unspecified (::)
  if (cleanIp === '::' || cleanIp === '0:0:0:0:0:0:0:0') return true;

  // Unique Local Address (fc00::/7 -> fc00... to fdff...)
  if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true;

  // Link-Local Unicast (fe80::/10 -> fe80... to febf...)
  if (
    cleanIp.startsWith('fe8') ||
    cleanIp.startsWith('fe9') ||
    cleanIp.startsWith('fea') ||
    cleanIp.startsWith('feb')
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:192.168.1.1)
  if (cleanIp.startsWith('::ffff:')) {
    const v4 = cleanIp.substring(7);
    if (v4.includes('.')) {
      return isPrivateIPv4(v4);
    }
  }

  return false;
}

/**
 * Validates a target URL against SSRF threats and protocol constraints.
 */
export async function validateSafeUrl(rawUrl: string): Promise<UrlSecurityResult> {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      safe: false,
      errorCode: 'INVALID_URL',
      errorMessage: '請輸入有效的網址',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      safe: false,
      errorCode: 'INVALID_URL',
      errorMessage: '網址格式不正確，請輸入包含 http:// 或 https:// 之有效網址',
    };
  }

  // 1. Protocol validation: Only http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      safe: false,
      errorCode: 'INVALID_URL',
      errorMessage: '僅支援 HTTP 與 HTTPS 協定，禁止使用 file://、ftp:// 或其他協定',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Explicit disallowed keywords / local names
  const blockedHostnames = [
    'localhost',
    'localhost.localdomain',
    'broadcasthost',
    'metadata.google.internal',
    'metadata.internal',
    'instance-data',
  ];

  if (blockedHostnames.includes(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return {
      safe: false,
      errorCode: 'BLOCKED_URL',
      errorMessage: '安全防護阻擋：禁止存取本機 (localhost) 或內部服務端點',
    };
  }

  // 3. Port restrictions
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    // Disallow dangerous internal ports like 22(SSH), 25(SMTP), 3000(Dev), 3306(MySQL), 5432(Postgres), 6379(Redis), 27017(Mongo)
    const dangerousPorts = [21, 22, 23, 25, 3000, 3306, 5432, 6379, 8000, 8080, 8888, 9200, 27017];
    if (dangerousPorts.includes(portNum)) {
      return {
        safe: false,
        errorCode: 'BLOCKED_URL',
        errorMessage: `安全防護阻擋：禁止存取特殊內部連接埠 (Port ${portNum})`,
      };
    }
  }

  // 4. Check if hostname is direct IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return {
        safe: false,
        errorCode: 'BLOCKED_URL',
        errorMessage: '安全防護阻擋：禁止存取私有 IP 網段或雲端中繼資料端點',
      };
    }
    return {
      safe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      resolvedIp: hostname,
    };
  }

  // Check direct IPv6
  if (hostname.includes(':')) {
    if (isPrivateIPv6(hostname)) {
      return {
        safe: false,
        errorCode: 'BLOCKED_URL',
        errorMessage: '安全防護阻擋：禁止存取私有 IPv6 網段',
      };
    }
    return {
      safe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      resolvedIp: hostname,
    };
  }

  // 5. DNS Resolution SSRF Check (prevent DNS rebinding or internal domain names)
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return {
        safe: false,
        errorCode: 'BLOCKED_URL',
        errorMessage: '無法解析此網域名稱 (DNS Lookup Failed)',
      };
    }

    for (const record of lookupResult) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        return {
          safe: false,
          errorCode: 'BLOCKED_URL',
          errorMessage: '安全防護阻擋：該網域解析至內部或保留私有 IP 網段',
          resolvedIp: record.address,
        };
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        return {
          safe: false,
          errorCode: 'BLOCKED_URL',
          errorMessage: '安全防護阻擋：該網域解析至內部 IPv6 網段',
          resolvedIp: record.address,
        };
      }
    }

    return {
      safe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      resolvedIp: lookupResult[0]?.address,
    };
  } catch (err: any) {
    return {
      safe: false,
      errorCode: 'BLOCKED_URL',
      errorMessage: `網址網域解析失敗：${err.code || '主機不存在或無法連線'}`,
    };
  }
}
