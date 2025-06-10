import express, { Request, Response } from 'express';
import { supabase } from '@/config/database';
import { asyncHandler, AppError } from '@/middleware/errorMiddleware';
import { validate } from '@/middleware/validation';
import { chatMessageSchema } from '@/middleware/validation';
import { protect } from '@/middleware/auth';
import { 
  ApiResponse, 
  PaginatedResponse, 
  ChatConversation, 
  ChatMessage, 
  CreateChatMessageRequest 
} from '@/types';
import logger from '@/utils/logger';

const router = express.Router();

// @desc    Get user's chat conversations
// @route   GET /api/v1/chat/conversations
// @access  Private
router.get('/conversations', protect, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      chat_messages(
        content,
        message_type,
        sender,
        created_at
      )
    `)
    .eq('user_id', req.user!.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    logger.error('Conversations fetch error:', error);
    throw new AppError('Failed to fetch conversations', 500);
  }

  // Add last message to each conversation
  const processedConversations = conversations?.map(conversation => {
    const lastMessage = conversation.chat_messages?.[0];
    return {
      ...conversation,
      last_message: lastMessage,
      message_count: conversation.chat_messages?.length || 0,
      chat_messages: undefined
    };
  }) || [];

  const response: PaginatedResponse<{ conversations: any[] }> = {
    success: true,
    data: { conversations: processedConversations },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: processedConversations.length
    }
  };

  res.json(response);
}));

// @desc    Get single conversation with messages
// @route   GET /api/v1/chat/conversations/:id
// @access  Private
router.get('/conversations/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  // Check if conversation exists and user owns it
  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (convError || !conversation) {
    throw new AppError('Conversation not found', 404);
  }

  // Get messages for this conversation
  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', req.params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (messagesError) {
    logger.error('Messages fetch error:', messagesError);
    throw new AppError('Failed to fetch messages', 500);
  }

  const response: ApiResponse<{ 
    conversation: ChatConversation; 
    messages: ChatMessage[] 
  }> = {
    success: true,
    data: {
      conversation,
      messages: messages || []
    }
  };

  res.json(response);
}));

// @desc    Create new conversation
// @route   POST /api/v1/chat/conversations
// @access  Private
router.post('/conversations', protect, asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body;

  const { data: conversation, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: req.user!.id,
      title: title || 'New Conversation'
    })
    .select()
    .single();

  if (error) {
    logger.error('Conversation creation error:', error);
    throw new AppError('Failed to create conversation', 500);
  }

  logger.info('Chat conversation created', { conversationId: conversation.id, userId: req.user!.id });

  const response: ApiResponse<{ conversation: ChatConversation }> = {
    success: true,
    message: 'Conversation created successfully',
    data: { conversation }
  };

  res.status(201).json(response);
}));

// @desc    Send message
// @route   POST /api/v1/chat/messages
// @access  Private
router.post('/messages', protect, validate(chatMessageSchema), asyncHandler(async (req: Request, res: Response) => {
  const { conversation_id, content, message_type = 'text', image_url }: CreateChatMessageRequest = req.body;
  let conversationId: string = conversation_id || '';

  // If no conversation_id provided, create a new conversation
  if (!conversationId) {
    const { data: newConversation, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: req.user!.id,
        title: content.substring(0, 50) + '...'
      })
      .select()
      .single();

    if (convError) {
      logger.error('Auto conversation creation error:', convError);
      throw new AppError('Failed to create conversation', 500);
    }

    conversationId = newConversation.id;
  } else {
    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation || conversation.user_id !== req.user!.id) {
      throw new AppError('Conversation not found or access denied', 404);
    }
  }
  // Insert user message
  const { data: userMessage, error: userMessageError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      content,
      message_type,
      sender: 'user',
      image_url
    })
    .select()
    .single();

  if (userMessageError) {
    logger.error('User message creation error:', userMessageError);
    throw new AppError('Failed to send message', 500);
  }

  // Generate AI response (simplified - in production you'd integrate with actual AI service)
  const aiResponse = generateAIResponse(content);

  const { data: aiMessage, error: aiMessageError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      content: aiResponse,
      message_type: 'text',
      sender: 'ai',
      metadata: {
        model: 'rasain-assistant',
        confidence: 0.95
      }
    })
    .select()
    .single();

  if (aiMessageError) {
    logger.error('AI message creation error:', aiMessageError);
    // Don't fail if AI response fails
  }

  // Update conversation timestamp
  await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  const response: ApiResponse<{ 
    user_message: ChatMessage; 
    ai_message?: ChatMessage;
    conversation_id: string;
  }> = {
    success: true,
    message: 'Message sent successfully',
    data: {
      user_message: userMessage,
      ai_message: aiMessage || undefined,
      conversation_id: conversationId
    }
  };

  res.status(201).json(response);
}));

// @desc    Rate AI message
// @route   POST /api/v1/chat/messages/:id/rate
// @access  Private
router.post('/messages/:id/rate', protect, asyncHandler(async (req: Request, res: Response) => {
  const { positive } = req.body;

  if (typeof positive !== 'boolean') {
    throw new AppError('Rating must be true (positive) or false (negative)', 400);
  }

  // Check if message exists and is an AI message
  const { data: message, error: messageError } = await supabase
    .from('chat_messages')
    .select(`
      *,
      chat_conversations(user_id)
    `)
    .eq('id', req.params.id)
    .eq('sender', 'ai')
    .single();

  if (messageError || !message) {
    throw new AppError('AI message not found', 404);
  }

  // Verify user owns the conversation
  if (message.chat_conversations?.user_id !== req.user!.id) {
    throw new AppError('Not authorized to rate this message', 403);
  }

  const updateData = positive
    ? { is_rated_positive: true, is_rated_negative: false }
    : { is_rated_positive: false, is_rated_negative: true };

  const { error } = await supabase
    .from('chat_messages')
    .update(updateData)
    .eq('id', req.params.id);

  if (error) {
    logger.error('Message rating error:', error);
    throw new AppError('Failed to rate message', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Message rated successfully'
  };

  res.json(response);
}));

// @desc    Delete conversation
// @route   DELETE /api/v1/chat/conversations/:id
// @access  Private
router.delete('/conversations/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if conversation exists and user owns it
  const { data: conversation, error: checkError } = await supabase
    .from('chat_conversations')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (conversation.user_id !== req.user!.id) {
    throw new AppError('Not authorized to delete this conversation', 403);
  }

  const { error } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    logger.error('Conversation deletion error:', error);
    throw new AppError('Failed to delete conversation', 500);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Conversation deleted successfully'
  };

  res.json(response);
}));

// Helper function to generate AI responses (placeholder)
function generateAIResponse(userMessage: string): string {
  const responses = [
    "Terima kasih atas pertanyaannya! Saya akan membantu Anda dengan resep masakan Indonesia.",
    "Saya bisa membantu Anda menemukan resep yang sesuai dengan bahan-bahan yang ada di pantry Anda.",
    "Mari kita cari resep yang cocok untuk Anda. Bahan apa saja yang tersedia di dapur?",
    "Saya akan memberikan saran resep tradisional Indonesia yang lezat dan mudah dibuat.",
    "Butuh bantuan memasak? Saya siap membantu dengan tips dan trik memasak yang praktis!"
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('resep') || lowerMessage.includes('recipe')) {
    return "Saya bisa membantu Anda mencari resep! Jenis masakan apa yang ingin Anda buat hari ini?";
  }
  
  if (lowerMessage.includes('bahan') || lowerMessage.includes('ingredient')) {
    return "Mari kita lihat bahan apa saja yang ada di pantry Anda. Saya bisa menyarankan resep berdasarkan bahan yang tersedia.";
  }
  
  if (lowerMessage.includes('masak') || lowerMessage.includes('cook')) {
    return "Saya akan membantu Anda dengan tips memasak! Apa yang ingin Anda masak hari ini?";
  }

  // Return random response for other messages
  return responses[Math.floor(Math.random() * responses.length)];
}

export default router;
