export interface ICryptoService {
  encrypt(plainText: string): string;
  decrypt(cipherText: string): string;
}
