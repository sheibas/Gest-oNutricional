import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número de telefone ou celular brasileiro
 * Ex: 11987654321 -> (11) 98765-4321
 */
export function formatPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Calcula a idade a partir da data de nascimento (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Calcula o IMC a partir do peso (kg) e altura (cm ou m)
 */
export function calculateIMC(peso?: number | null, altura?: number | null): {
  value: number | null;
  formatted: string;
  label: string;
  colorClass: string;
} {
  if (!peso || !altura || peso <= 0 || altura <= 0) {
    return {
      value: null,
      formatted: '-',
      label: 'Aguardando peso e altura',
      colorClass: 'text-zinc-500',
    };
  }

  // Altura pode ser informada em cm (ex: 175) ou metros (ex: 1.75)
  const alturaMetros = altura > 3 ? altura / 100 : altura;
  if (alturaMetros <= 0) {
    return {
      value: null,
      formatted: '-',
      label: 'Altura inválida',
      colorClass: 'text-zinc-500',
    };
  }

  const imc = peso / (alturaMetros * alturaMetros);
  const rounded = Number(imc.toFixed(1));

  if (rounded < 18.5) {
    return {
      value: rounded,
      formatted: rounded.toFixed(1),
      label: 'Abaixo do peso',
      colorClass: 'text-amber-400',
    };
  } else if (rounded < 24.9) {
    return {
      value: rounded,
      formatted: rounded.toFixed(1),
      label: 'Peso normal (Eutrofia)',
      colorClass: 'text-emerald-400',
    };
  } else if (rounded < 29.9) {
    return {
      value: rounded,
      formatted: rounded.toFixed(1),
      label: 'Sobrepeso',
      colorClass: 'text-amber-500',
    };
  } else if (rounded < 34.9) {
    return {
      value: rounded,
      formatted: rounded.toFixed(1),
      label: 'Obesidade Grau I',
      colorClass: 'text-rose-400',
    };
  } else if (rounded < 39.9) {
    return {
      value: rounded,
      formatted: rounded.toFixed(1),
      label: 'Obesidade Grau II',
      colorClass: 'text-rose-500',
    };
  } else {
    return {
      value: rounded,
      formatted: rounded.toFixed(1),
      label: 'Obesidade Grau III',
      colorClass: 'text-rose-600',
    };
  }
}

/**
 * Converte entrada numérica para formato de hora HH:mm
 * Ex: 6 -> "06:00"
 * Ex: 630 -> "06:30"
 * Ex: 23 -> "23:00"
 * Ex: 2230 -> "22:30"
 */
export function formatTimeInput(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Se já tiver dois pontos, ex: "6:30" ou "06:30"
  if (trimmed.includes(':')) {
    const [h, m] = trimmed.split(':');
    const hourNum = parseInt(h, 10);
    const minNum = parseInt(m || '0', 10);
    if (!isNaN(hourNum) && !isNaN(minNum) && hourNum >= 0 && hourNum <= 23 && minNum >= 0 && minNum <= 59) {
      return `${String(hourNum).padStart(2, '0')}:${String(minNum).padStart(2, '0')}`;
    }
    return trimmed;
  }

  // Apenas dígitos
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;

  if (digits.length === 1 || digits.length === 2) {
    const h = parseInt(digits, 10);
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:00`;
    }
  } else if (digits.length === 3) {
    // Ex: 630 -> 06:30
    const h = parseInt(digits.slice(0, 1), 10);
    const m = parseInt(digits.slice(1, 3), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  } else if (digits.length === 4) {
    // Ex: 2230 -> 22:30
    const h = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return trimmed;
}

/**
 * Formata data ISO para PT-BR DD/MM/AAAA
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}
