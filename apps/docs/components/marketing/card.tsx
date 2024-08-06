import { cn } from '@/utils/cn'

export const Card: React.FC<{
	children: React.ReactNode
	className?: string
	darker?: boolean
}> = ({ children, className, darker }) => {
	return (
		<div
			className={cn(
				'py-1 md:rounded-2xl md:mx-0 md:px-1',
				darker ? 'bg-zinc-100' : 'bg-zinc-50',
				className
			)}
		>
			<div className="relative w-full h-full bg-zinc-50 md:rounded-xl shadow overflow-hidden">
				{children}
			</div>
		</div>
	)
}
