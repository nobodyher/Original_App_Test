import bcrypt from 'bcryptjs';

/**
 * Genera un hash seguro para el PIN proporcionado.
 * @param pin El PIN en texto plano.
 * @returns Una promesa que resuelve con el hash del PIN.
 */
export const hashPin = async (pin: string): Promise<string> => {
  return bcrypt.hash(pin, 10);
};

/**
 * Verifica si un PIN en texto plano coincide con su hash.
 * @param pin El PIN en texto plano.
 * @param hash El hash almacenado.
 * @returns Una promesa que resuelve con true si coinciden, false en caso contrario.
 */
export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(pin, hash);
};
