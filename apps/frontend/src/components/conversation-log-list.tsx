'use client'

import { ConversationLog } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ConversationLogListProps {
  conversations: ConversationLog[]
}

export function ConversationLogList({ conversations }: ConversationLogListProps) {
  // Sort conversations in chronological order (oldest first)
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  if (sortedConversations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No conversation logs yet. Add one to get started.
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      Email: 'bg-blue-100 text-blue-800',
      Instagram: 'bg-pink-100 text-pink-800',
      WhatsApp: 'bg-green-100 text-green-800',
      Phone: 'bg-purple-100 text-purple-800',
      InPerson: 'bg-orange-100 text-orange-800',
      Other: 'bg-gray-100 text-gray-800',
    }
    return colors[channel] || colors.Other
  }

  return (
    <div className="space-y-3">
      {sortedConversations.map((conversation) => (
        <Card key={conversation.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge className={getChannelColor(conversation.channel)} variant="secondary">
                {conversation.channel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(conversation.created_at)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{conversation.message_text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
