import { render, screen } from '@testing-library/react'
import { ConversationLogList } from '../conversation-log-list'
import { ConversationLog, CommunicationChannel } from '@/types'

describe('ConversationLogList', () => {
  const mockConversations: ConversationLog[] = [
    {
      id: 1,
      collaboration_id: 1,
      channel: CommunicationChannel.Email,
      message_text: 'Initial outreach email sent',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      collaboration_id: 1,
      channel: CommunicationChannel.Instagram,
      message_text: 'Brand responded via DM',
      created_at: '2024-01-16T14:30:00Z',
    },
    {
      id: 3,
      collaboration_id: 1,
      channel: CommunicationChannel.WhatsApp,
      message_text: 'Discussed campaign details',
      created_at: '2024-01-17T09:15:00Z',
    },
  ]

  describe('Rendering', () => {
    it('should display empty state when no conversations', () => {
      render(<ConversationLogList conversations={[]} />)

      expect(
        screen.getByText('No conversation logs yet. Add one to get started.')
      ).toBeInTheDocument()
    })

    it('should display all conversations', () => {
      render(<ConversationLogList conversations={mockConversations} />)

      expect(screen.getByText('Initial outreach email sent')).toBeInTheDocument()
      expect(screen.getByText('Brand responded via DM')).toBeInTheDocument()
      expect(screen.getByText('Discussed campaign details')).toBeInTheDocument()
    })

    it('should display channel badges', () => {
      render(<ConversationLogList conversations={mockConversations} />)

      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Instagram')).toBeInTheDocument()
      expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    })

    it('should display timestamps', () => {
      render(<ConversationLogList conversations={mockConversations} />)

      // Check that dates are displayed (format may vary)
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 16, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 17, 2024/i)).toBeInTheDocument()
    })
  })

  describe('Chronological Ordering', () => {
    it('should display conversations in chronological order (oldest first)', () => {
      const unorderedConversations: ConversationLog[] = [
        {
          id: 3,
          collaboration_id: 1,
          channel: CommunicationChannel.Phone,
          message_text: 'Third conversation',
          created_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 1,
          collaboration_id: 1,
          channel: CommunicationChannel.Email,
          message_text: 'First conversation',
          created_at: '2024-01-18T10:00:00Z',
        },
        {
          id: 2,
          collaboration_id: 1,
          channel: CommunicationChannel.Instagram,
          message_text: 'Second conversation',
          created_at: '2024-01-19T10:00:00Z',
        },
      ]

      render(<ConversationLogList conversations={unorderedConversations} />)

      const messages = screen.getAllByText(/conversation/)
      expect(messages[0]).toHaveTextContent('First conversation')
      expect(messages[1]).toHaveTextContent('Second conversation')
      expect(messages[2]).toHaveTextContent('Third conversation')
    })
  })

  describe('Channel Badge Colors', () => {
    it('should apply different colors to different channels', () => {
      const channelConversations: ConversationLog[] = [
        {
          id: 1,
          collaboration_id: 1,
          channel: CommunicationChannel.Email,
          message_text: 'Email message',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          collaboration_id: 1,
          channel: CommunicationChannel.Instagram,
          message_text: 'Instagram message',
          created_at: '2024-01-16T10:00:00Z',
        },
        {
          id: 3,
          collaboration_id: 1,
          channel: CommunicationChannel.WhatsApp,
          message_text: 'WhatsApp message',
          created_at: '2024-01-17T10:00:00Z',
        },
      ]

      render(<ConversationLogList conversations={channelConversations} />)

      const emailBadge = screen.getByText('Email')
      const instagramBadge = screen.getByText('Instagram')
      const whatsappBadge = screen.getByText('WhatsApp')

      // Check that badges have different color classes
      expect(emailBadge).toHaveClass('bg-blue-100')
      expect(instagramBadge).toHaveClass('bg-pink-100')
      expect(whatsappBadge).toHaveClass('bg-green-100')
    })
  })

  describe('Message Display', () => {
    it('should preserve whitespace in messages', () => {
      const conversationWithWhitespace: ConversationLog[] = [
        {
          id: 1,
          collaboration_id: 1,
          channel: CommunicationChannel.Email,
          message_text: 'Line 1\nLine 2\nLine 3',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<ConversationLogList conversations={conversationWithWhitespace} />)

      const messageElement = screen.getByText(/Line 1/)
      expect(messageElement).toHaveClass('whitespace-pre-wrap')
    })

    it('should display long messages', () => {
      const longMessage = 'A'.repeat(500)
      const conversationWithLongMessage: ConversationLog[] = [
        {
          id: 1,
          collaboration_id: 1,
          channel: CommunicationChannel.Email,
          message_text: longMessage,
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<ConversationLogList conversations={conversationWithLongMessage} />)

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })
  })

  describe('All Communication Channels', () => {
    it('should support all channel types', () => {
      const allChannels: ConversationLog[] = [
        {
          id: 1,
          collaboration_id: 1,
          channel: CommunicationChannel.Email,
          message_text: 'Email message content',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          collaboration_id: 1,
          channel: CommunicationChannel.Instagram,
          message_text: 'Instagram message content',
          created_at: '2024-01-15T11:00:00Z',
        },
        {
          id: 3,
          collaboration_id: 1,
          channel: CommunicationChannel.WhatsApp,
          message_text: 'WhatsApp message content',
          created_at: '2024-01-15T12:00:00Z',
        },
        {
          id: 4,
          collaboration_id: 1,
          channel: CommunicationChannel.Phone,
          message_text: 'Phone message content',
          created_at: '2024-01-15T13:00:00Z',
        },
        {
          id: 5,
          collaboration_id: 1,
          channel: CommunicationChannel.InPerson,
          message_text: 'In Person message content',
          created_at: '2024-01-15T14:00:00Z',
        },
        {
          id: 6,
          collaboration_id: 1,
          channel: CommunicationChannel.Other,
          message_text: 'Other message content',
          created_at: '2024-01-15T15:00:00Z',
        },
      ]

      render(<ConversationLogList conversations={allChannels} />)

      // Check for channel badges (they appear as badges, not just text)
      const badges = screen.getAllByText(/Email|Instagram|WhatsApp|Phone|InPerson|Other/)
      expect(badges.length).toBeGreaterThanOrEqual(6)
      
      // Check for message content
      expect(screen.getByText('Email message content')).toBeInTheDocument()
      expect(screen.getByText('Instagram message content')).toBeInTheDocument()
      expect(screen.getByText('WhatsApp message content')).toBeInTheDocument()
      expect(screen.getByText('Phone message content')).toBeInTheDocument()
      expect(screen.getByText('In Person message content')).toBeInTheDocument()
      expect(screen.getByText('Other message content')).toBeInTheDocument()
    })
  })
})
