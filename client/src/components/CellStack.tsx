import type { ReactNode } from 'react'

type CellStackProps = {
    primary: ReactNode
    secondary?: ReactNode
    align?: 'left' | 'right'
}

export default function CellStack({ primary, secondary, align = 'left' }: CellStackProps) {
    return (
        <div className={align === 'right' ? 'text-right' : 'text-left'}>
            <div>{primary}</div>
            {secondary && (
                <div className='text-xs font-normal text-gray-dark dark:text-dark-text-muted'>{secondary}</div>
            )}
        </div>
    )
}
