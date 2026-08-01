export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
}

export interface ChatState {
  messages: Message[]
  input: string
  isLoading: boolean
  error: string | null
  isTyping: boolean
}

export interface ChatActions {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setInput: React.Dispatch<React.SetStateAction<string>>
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
  sendMessage: () => Promise<void>
  handleKeyPress: (e: React.KeyboardEvent) => void
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}
