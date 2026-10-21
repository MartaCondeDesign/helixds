import type { TextareaHTMLAttributes } from 'react';

export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label:        string;
  description?: string;
  errorMessage?: string;
  invalid?:     boolean;
  required?:    boolean;
  fullWidth?:   boolean;
  hideLabel?:   boolean;
  rows?:        number;
  maxLength?:   number;
  resize?:      TextareaResize;
  showCount?:   boolean;
}
