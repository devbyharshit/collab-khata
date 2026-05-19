import * as React from "react"

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  preTitle?: React.ReactNode
  action?: React.ReactNode
}

export function PageHeader({ title, description, preTitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div>
        {preTitle && (
          <div className="mb-2">
            {preTitle}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          {action}
        </div>
      )}
    </div>
  )
}
