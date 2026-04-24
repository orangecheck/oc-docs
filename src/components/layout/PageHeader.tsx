import { cn } from '@/lib/utils/utils';

export interface PageHeaderProps {
    title: string;
    description?: string;
    eyebrow?: string;
    className?: string;
}

export function PageHeader({ title, description, eyebrow, className }: PageHeaderProps) {
    return (
        <div className={cn('space-y-3 border-b pb-6', className)}>
            {eyebrow && <div className="label-mono text-primary">§ {eyebrow}</div>}
            <h1 className="font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
                {title}
            </h1>
            {description && (
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed md:text-base">
                    {description}
                </p>
            )}
        </div>
    );
}
