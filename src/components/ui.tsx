import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ProjectStatus } from '../types';

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>;
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: ReactNode; subtitle?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>{action}</div>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice"><span className="notice-icon">i</span><span>{children}</span></div>;
}

export function Panel({ title, subtitle, action, className = '', children }: { title: string; subtitle?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const style = status === 'กำลังดำเนินการ' ? 'badge-green' : status === 'รอตรวจสอบ' ? 'badge-yellow' : 'badge-blue';
  return <span className={`badge ${style}`}><i />{status}</span>;
}

export function StatCard({ label, value, unit, hint, icon, color = 'green' }: { label: string; value: string | number; unit?: string; hint: string; icon: ReactNode; color?: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}>{icon}</span></div><div className="stat-value">{value} {unit && <small>{unit}</small>}</div><div className="stat-foot"><span className="muted">{hint}</span></div></article>;
}
