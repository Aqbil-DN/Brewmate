import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { GroqService } from './groq.service.js';

@Controller('ai')
export class AiController {
  constructor(private readonly groqService: GroqService) {}

  @Post('dev/barista-reply')
  async devBaristaReply(@Body('message') message: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    if (!message) {
      return { success: false, message: 'Please provide a message.' };
    }

    const mockMenu = [
      {
        productId: '1',
        name: 'Iced Palm Sugar Latte',
        price: 42000,
        category: 'Coffee',
        aiDescription: 'Sweet and creamy espresso with natural palm sugar.',
      },
      {
        productId: '2',
        name: 'Iced Americano',
        price: 28000,
        category: 'Coffee',
        aiDescription: 'Bold, cold, and refreshing. Zero sugar.',
      }
    ];

    const result = await this.groqService.generateBaristaReply({
      userMessage: message,
      menuContext: mockMenu,
      language: 'id',
    });

    return {
      success: true,
      data: result,
    };
  }
}
