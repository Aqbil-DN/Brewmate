import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getCategories() {
    return this.productsService.getCategories();
  }
}
