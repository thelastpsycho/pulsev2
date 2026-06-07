import type { IconName } from '@/types';

export const TOKENS: {
  accent: string;
  text: string;
  textSecondary: string;
  muted: string;
  mutedLight: string;
  border: string;
  borderStrong: string;
  surface: string;
  bg: string;
  bgSoft: string;
  success: string;
  warning: string;
  danger: string;
  urgent: string;
  high: string;
  medium: string;
  low: string;
  purple: string;
  gold: string;
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export const Icon: React.ComponentType<IconProps>;
export const cx: (...classes: (string | boolean | undefined)[]) => string;
export const Button: React.ComponentType<any>;
export const IconButton: React.ComponentType<any>;
export const Avatar: React.ComponentType<{ name: string; size?: number; className?: string }>;
export const Card: React.ComponentType<any>;
export const CardHeader: React.ComponentType<any>;
export const Skeleton: React.ComponentType<any>;
export const EmptyState: React.ComponentType<any>;
export const Kbd: React.ComponentType<any>;
export const Pill: React.ComponentType<any>;
export const PriorityPill: React.ComponentType<{ value: string }>;
export const StatusPill: React.ComponentType<{ value: string }>;
