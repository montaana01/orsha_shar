import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variants = 'primary' | 'secondary' | 'ghost';

type LinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variants;
  external?: boolean;
  ariaLabel?: string;
  className?: string;
};

type NativeButtonProps = {
  href?: undefined;
  children: ReactNode;
  variant?: Variants;
  ariaLabel?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'aria-label'>;

export type ButtonProps = LinkProps | NativeButtonProps;

export function Button(props: ButtonProps) {
  const variant = props.variant ?? 'primary';
  const className = [
    'btn',
    `btn--${variant}`,
    'className' in props && props.className ? props.className : '',
  ]
    .filter(Boolean)
    .join(' ');

  if ('href' in props && typeof props.href === 'string') {
    const { href, children, external, ariaLabel } = props;
    if (external) {
      return (
        <a
          className={className}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
        >
          {children}
        </a>
      );
    }

    return (
      <Link className={className} href={href} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  const { children, ariaLabel, ...rest } = props;
  return (
    <button className={className} aria-label={ariaLabel} {...rest}>
      {children}
    </button>
  );
}
