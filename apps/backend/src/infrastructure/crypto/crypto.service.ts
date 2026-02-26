import CryptoJS from "crypto-js";
import type { ICryptoService } from "../../domain/interfaces/crypto.interface";

const DEFAULT_SECRET = "verba-dev-secret-key-change-in-production";

export class CryptoService implements ICryptoService {
  private secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.ENCRYPTION_SECRET || DEFAULT_SECRET;
  }

  encrypt(plainText: string): string {
    return CryptoJS.AES.encrypt(plainText, this.secret).toString();
  }

  decrypt(cipherText: string): string {
    const bytes = CryptoJS.AES.decrypt(cipherText, this.secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
